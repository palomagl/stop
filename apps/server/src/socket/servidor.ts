import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Server, type Socket } from 'socket.io';
import {
  DURACOES,
  esquemasCliente,
  type ClienteParaServidor,
  type DadosEvento,
  type Duracoes,
  type EventoCliente,
  type RespostaEntrada,
  type ServidorParaCliente,
} from '@rabisco/shared';
import { GerenciadorDeSalas } from '../jogo/gerenciador';
import type { Jogador, Sala } from '../jogo/sala';
import { LimiteDeEventos } from './limite';

interface DadosSocket {
  codigo?: string;
  jogadorId?: string;
}

type SocketJogo = Socket<ClienteParaServidor, ServidorParaCliente, Record<string, never>, DadosSocket>;
type Ack = (r: RespostaEntrada) => void;

export interface OpcoesServidor {
  porta?: number;
  /** Origens liberadas no CORS. Vazio libera qualquer uma (bom para desenvolvimento). */
  origens?: string[];
  duracoes?: Partial<Duracoes>;
  aleatorio?: () => number;
}

export interface ServidorRodando {
  porta: number;
  gerenciador: GerenciadorDeSalas;
  fechar: () => Promise<void>;
}

const INTERVALO_LIMPEZA_MS = 60_000;

export async function iniciarServidor(opcoes: OpcoesServidor = {}): Promise<ServidorRodando> {
  const origens = opcoes.origens?.length ? opcoes.origens : true;

  const http = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ ok: true, salas: gerenciador.total }));
      return;
    }
    res.writeHead(404).end();
  });

  const io = new Server<ClienteParaServidor, ServidorParaCliente, Record<string, never>, DadosSocket>(http, {
    cors: { origin: origens },
    // Respostas e votos são pequenos. Isso barra pacotes gigantes logo na entrada.
    maxHttpBufferSize: 16 * 1024,
  });

  const pendentes = new Set<Sala>();
  let envioAgendado = false;

  /** Junta várias mudanças seguidas num envio só por sala. */
  function agendarEnvio(sala: Sala) {
    pendentes.add(sala);
    if (envioAgendado) return;
    envioAgendado = true;
    setImmediate(() => {
      envioAgendado = false;
      for (const s of pendentes) {
        for (const j of s.jogadores.values()) {
          if (j.socketId) io.to(j.socketId).emit('sala:estado', s.estadoPara(j.id));
        }
      }
      pendentes.clear();
    });
  }

  const gerenciador = new GerenciadorDeSalas(
    { duracoes: { ...DURACOES, ...opcoes.duracoes }, aleatorio: opcoes.aleatorio ?? Math.random },
    (sala) => {
      sala.on('mudou', () => agendarEnvio(sala));
      sala.on('stop', (dados) => io.to(sala.codigo).emit('rodada:stop', dados));
      sala.on('reacao', (dados) => io.to(sala.codigo).emit('reacao', dados));
      sala.on('removido', (jogador, motivo) => {
        const socket = jogador.socketId ? io.sockets.sockets.get(jogador.socketId) : undefined;
        if (!socket) return;
        socket.leave(sala.codigo);
        socket.data = {};
        if (motivo !== 'saiu') socket.emit('jogador:removido');
      });
      sala.on('vazia', () => pendentes.delete(sala));
    },
  );

  const limpeza = setInterval(() => gerenciador.limparAbandonadas(), INTERVALO_LIMPEZA_MS);
  limpeza.unref();

  io.on('connection', (socket: SocketJogo) => {
    const limite = new LimiteDeEventos();
    socket.use((_pacote, next) => (limite.permitir() ? next() : next(new Error('limite'))));
    socket.on('error', () => socket.emit('sala:erro', { mensagem: 'Calma! Muitas ações seguidas.' }));

    /** Valida o evento com Zod antes de chamar o handler. O que não passar é ignorado. */
    function ouvir<E extends EventoCliente>(
      evento: E,
      tratar: (dados: DadosEvento<E>, ack: Ack | undefined) => string | null | void,
    ) {
      const on = socket.on.bind(socket) as unknown as (e: string, fn: (...args: unknown[]) => void) => void;
      on(evento, (...args) => {
        const ack = typeof args.at(-1) === 'function' ? (args.pop() as Ack) : undefined;
        const resultado = esquemasCliente[evento].safeParse(args[0]);
        if (!resultado.success) {
          const mensagem = resultado.error.issues[0]?.message ?? 'Dados inválidos.';
          if (ack) ack({ ok: false, erro: mensagem });
          return;
        }
        const erro = tratar(resultado.data as DadosEvento<E>, ack);
        if (typeof erro === 'string') socket.emit('sala:erro', { mensagem: erro });
      });
    }

    function contexto(): { sala: Sala; jogador: Jogador } | null {
      const { codigo, jogadorId } = socket.data;
      if (!codigo || !jogadorId) return null;
      const sala = gerenciador.buscar(codigo);
      const jogador = sala?.jogadores.get(jogadorId);
      return sala && jogador ? { sala, jogador } : null;
    }

    function vincular(sala: Sala, jogador: Jogador, ack: Ack | undefined) {
      sairDaSalaAtual(jogador.id);
      if (jogador.socketId && jogador.socketId !== socket.id) {
        // A pessoa abriu o jogo em outra aba ou voltou por outra conexão: a antiga deixa de valer.
        const antigo = io.sockets.sockets.get(jogador.socketId);
        antigo?.leave(sala.codigo);
        if (antigo) antigo.data = {};
      }
      socket.data = { codigo: sala.codigo, jogadorId: jogador.id };
      socket.join(sala.codigo);
      sala.conectar(jogador, socket.id);
      ack?.({ ok: true, codigo: sala.codigo, token: jogador.token, jogadorId: jogador.id });
    }

    /** Quem cria ou entra em outra sala deixa a anterior. */
    function sairDaSalaAtual(exceto?: string) {
      const atual = contexto();
      if (!atual || atual.jogador.id === exceto) return;
      socket.leave(atual.sala.codigo);
      socket.data = {};
      atual.sala.sair(atual.jogador.id);
    }

    ouvir('sala:criar', (dados, ack) => {
      sairDaSalaAtual();
      const sala = gerenciador.criar();
      const jogador = sala.adicionarJogador(dados.apelido, dados.avatar);
      if (typeof jogador === 'string') return void ack?.({ ok: false, erro: jogador });
      vincular(sala, jogador, ack);
    });

    ouvir('sala:entrar', (dados, ack) => {
      const sala = gerenciador.buscar(dados.codigo);
      if (!sala) return void ack?.({ ok: false, erro: 'Não achei essa sala. Confere o código?' });
      sairDaSalaAtual();
      const jogador = sala.adicionarJogador(dados.apelido, dados.avatar);
      if (typeof jogador === 'string') return void ack?.({ ok: false, erro: jogador });
      vincular(sala, jogador, ack);
    });

    ouvir('sala:reconectar', (dados, ack) => {
      const sala = gerenciador.buscar(dados.codigo);
      const jogador = sala?.porToken(dados.token);
      if (!sala || !jogador) return void ack?.({ ok: false, erro: 'Essa partida já acabou.' });
      vincular(sala, jogador, ack);
    });

    ouvir('sala:sair', () => sairDaSalaAtual());

    ouvir('sala:configurar', (config) => {
      const c = contexto();
      return c?.sala.configurar(c.jogador.id, config);
    });

    ouvir('sala:remover', ({ jogadorId }) => {
      const c = contexto();
      return c?.sala.remover(c.jogador.id, jogadorId);
    });

    ouvir('jogador:pronto', ({ pronto }) => {
      const c = contexto();
      return c?.sala.marcarPronto(c.jogador.id, pronto);
    });

    ouvir('partida:iniciar', () => {
      const c = contexto();
      return c?.sala.iniciar(c.jogador.id);
    });

    ouvir('partida:jogarDeNovo', ({ voltarParaSala }) => {
      const c = contexto();
      return c?.sala.jogarDeNovo(c.jogador.id, voltarParaSala);
    });

    ouvir('resposta:rascunho', ({ categoria, texto }) => {
      const c = contexto();
      c?.sala.rascunho(c.jogador.id, categoria, texto);
    });

    ouvir('rodada:stop', ({ respostas }) => {
      const c = contexto();
      return c?.sala.stop(c.jogador.id, respostas);
    });

    ouvir('voto:enviar', ({ indice, jogadorId, voto }) => {
      const c = contexto();
      return c?.sala.votar(c.jogador.id, indice, jogadorId, voto);
    });

    ouvir('correcao:pronto', ({ indice }) => {
      const c = contexto();
      c?.sala.prontoCorrecao(c.jogador.id, indice);
    });

    ouvir('resultado:pronto', ({ rodada }) => {
      const c = contexto();
      c?.sala.prontoResultado(c.jogador.id, rodada);
    });

    ouvir('reacao:enviar', ({ emoji }) => {
      const c = contexto();
      c?.sala.reagir(c.jogador.id, emoji);
    });

    socket.on('disconnect', () => {
      const c = contexto();
      c?.sala.desconectar(c.jogador.id, socket.id);
    });
  });

  await new Promise<void>((resolve) => http.listen(opcoes.porta ?? 0, resolve));
  const porta = (http.address() as AddressInfo).port;

  return {
    porta,
    gerenciador,
    fechar: async () => {
      clearInterval(limpeza);
      gerenciador.fechar();
      await io.close();
    },
  };
}
