import { useSyncExternalStore } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  ClienteParaServidor,
  Config,
  EstadoSala,
  Reacao,
  RespostaArquivo,
  RespostaEntrada,
  ServidorParaCliente,
  Voto,
} from '@rabisco/shared';
import { apagar, gravar, ler } from './armazenamento';
import { idDoDispositivo } from './dispositivo';
import { ultimaConfig } from './listas';
import { sons } from './sons';

export const URL_SERVIDOR: string = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3333';

export type Conexao = 'acordando' | 'online' | 'caiu';

export interface ReacaoNaTela {
  id: string;
  emoji: Reacao;
  apelido: string;
  /** Posição horizontal, de 0 a 1. */
  x: number;
}

export interface EstadoApp {
  conexao: Conexao;
  /** Verdadeiro enquanto tenta voltar para a sala salva no aparelho. */
  restaurando: boolean;
  sala: EstadoSala | null;
  /** Relógio do servidor menos o do navegador, em ms. */
  diferencaRelogio: number;
  aviso: { id: number; texto: string } | null;
  reacoes: ReacaoNaTela[];
}

interface Sessao {
  codigo: string;
  token: string;
}

// ── Store mínima, lida pelos componentes com useSyncExternalStore ───────

let estado: EstadoApp = {
  conexao: 'acordando',
  restaurando: ler<Sessao>('sessao') !== null,
  sala: null,
  diferencaRelogio: 0,
  aviso: null,
  reacoes: [],
};
const ouvintes = new Set<() => void>();

function mudar(parcial: Partial<EstadoApp>) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach((o) => o());
}

export function useJogo(): EstadoApp {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o);
      return () => ouvintes.delete(o);
    },
    () => estado,
  );
}

let proximoAviso = 1;
export function avisar(texto: string) {
  mudar({ aviso: { id: proximoAviso++, texto } });
}

export function fecharAviso(id: number) {
  if (estado.aviso?.id === id) mudar({ aviso: null });
}

// ── Endereço: /GATOS leva direto para a sala ─────────────────────────────

export function codigoDaUrl(): string | null {
  const achado = /^\/([a-z]{5})\/?$/i.exec(window.location.pathname);
  return achado ? achado[1]!.toUpperCase() : null;
}

export function linkDaSala(codigo: string): string {
  return `${window.location.origin}/${codigo}`;
}

function mostrarCodigoNaUrl(codigo: string | null) {
  const caminho = codigo ? `/${codigo}` : '/';
  if (window.location.pathname !== caminho) history.replaceState(null, '', caminho);
}

// ── Conexão ─────────────────────────────────────────────────────────────

const socket: Socket<ServidorParaCliente, ClienteParaServidor> = io(URL_SERVIDOR, {
  autoConnect: false,
  reconnectionDelayMax: 4000,
});

function entrouNaSala(resposta: RespostaEntrada): string | null {
  if (!resposta.ok) return resposta.erro;
  gravar('sessao', { codigo: resposta.codigo, token: resposta.token } satisfies Sessao);
  mostrarCodigoNaUrl(resposta.codigo);
  return null;
}

function esquecerSala() {
  apagar('sessao');
  mostrarCodigoNaUrl(null);
  mudar({ sala: null, restaurando: false });
}

socket.on('connect', () => {
  mudar({ conexao: 'online' });
  const sessao = ler<Sessao>('sessao');
  if (!sessao) {
    mudar({ restaurando: false });
    return;
  }
  // Voltou a internet ou atualizou a página: pede para entrar de novo no mesmo lugar.
  socket.emit('sala:reconectar', sessao, (resposta) => {
    if (resposta.ok) {
      entrouNaSala(resposta);
      mudar({ restaurando: false });
    } else {
      if (estado.sala) avisar(resposta.erro);
      esquecerSala();
    }
  });
});

socket.on('disconnect', () => mudar({ conexao: estado.conexao === 'acordando' ? 'acordando' : 'caiu' }));

socket.on('sala:estado', (sala) => {
  mudar({ sala, diferencaRelogio: sala.agora - Date.now() });
});

socket.on('sala:erro', ({ mensagem }) => avisar(mensagem));

socket.on('rodada:stop', () => sons.stop());

socket.on('reacao', ({ id, jogadorId, emoji }) => {
  const apelido = estado.sala?.jogadores.find((j) => j.id === jogadorId)?.apelido ?? '';
  const reacao: ReacaoNaTela = { id, emoji, apelido, x: 0.1 + Math.random() * 0.8 };
  mudar({ reacoes: [...estado.reacoes, reacao].slice(-20) });
  setTimeout(() => mudar({ reacoes: estado.reacoes.filter((r) => r.id !== id) }), 2600);
});

socket.on('jogador:removido', () => {
  avisar('Você saiu da sala.');
  esquecerSala();
});

export function conectar() {
  socket.connect();
}

// ── Ações ───────────────────────────────────────────────────────────────

function comAck<E extends 'sala:criar' | 'sala:entrar' | 'sala:jogarAgora'>(
  evento: E,
  dados: Parameters<ClienteParaServidor[E]>[0],
): Promise<string | null> {
  return new Promise((resolver) => {
    if (!socket.connected) return resolver('Sem conexão com o servidor. Tenta de novo em instantes.');
    const comPrazo = socket.timeout(8000);
    const emitir = comPrazo.emit.bind(comPrazo) as unknown as (
      e: string,
      d: unknown,
      ack: (erro: Error | null, r: RespostaEntrada) => void,
    ) => void;
    emitir(evento, dados, (erro, resposta) => {
      resolver(erro ? 'O servidor demorou para responder. Tenta de novo?' : entrouNaSala(resposta));
    });
  });
}

export const acoes = {
  async criarSala(apelido: string, avatar: number) {
    const erro = await comAck('sala:criar', { apelido, avatar, dispositivo: idDoDispositivo() });
    // A sala nova já nasce com as regras que a pessoa usou da última vez.
    const config = ultimaConfig();
    if (!erro && config) socket.emit('sala:configurar', { ...config, publica: false });
    return erro;
  },
  entrarSala: (codigo: string, apelido: string, avatar: number) =>
    comAck('sala:entrar', { codigo, apelido, avatar, dispositivo: idDoDispositivo() }),
  jogarAgora: (apelido: string, avatar: number) =>
    comAck('sala:jogarAgora', { apelido, avatar, dispositivo: idDoDispositivo() }),
  sair() {
    socket.emit('sala:sair');
    esquecerSala();
  },
  configurar: (config: Config) => socket.emit('sala:configurar', config),
  remover: (jogadorId: string) => socket.emit('sala:remover', { jogadorId }),
  pronto: (pronto: boolean) => socket.emit('jogador:pronto', { pronto }),
  iniciar: () => socket.emit('partida:iniciar'),
  jogarDeNovo: (voltarParaSala: boolean) => socket.emit('partida:jogarDeNovo', { voltarParaSala }),
  rascunho: (categoria: string, texto: string) => socket.emit('resposta:rascunho', { categoria, texto }),
  stop: (respostas: Record<string, string>) => socket.emit('rodada:stop', { respostas }),
  votar: (indice: number, jogadorId: string, voto: Voto) => socket.emit('voto:enviar', { indice, jogadorId, voto }),
  prontoCorrecao: (indice: number) => socket.emit('correcao:pronto', { indice }),
  prontoResultado: (rodada: number) => socket.emit('resultado:pronto', { rodada }),
  reagir: (emoji: Reacao) => socket.emit('reacao:enviar', { emoji }),
};

// ── Histórico e ranking (HTTP) ──────────────────────────────────────────

export async function buscarArquivo<T>(rota: '/ranking' | '/historico'): Promise<RespostaArquivo<T>> {
  const resposta = await fetch(`${URL_SERVIDOR}${rota}?dispositivo=${encodeURIComponent(idDoDispositivo())}`);
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return (await resposta.json()) as RespostaArquivo<T>;
}
