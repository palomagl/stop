import type { Config, EstadoSala, Reacao, Voto } from './tipos';

export type RespostaEntrada =
  | { ok: true; codigo: string; token: string; jogadorId: string }
  | { ok: false; erro: string };

/** Eventos que o navegador manda para o servidor. */
export interface DadosPerfil {
  apelido: string;
  avatar: number;
  /** Identificador anônimo do aparelho, para o histórico e o ranking. */
  dispositivo: string;
}

export interface ClienteParaServidor {
  'sala:criar': (dados: DadosPerfil, ack: (r: RespostaEntrada) => void) => void;
  'sala:entrar': (dados: DadosPerfil & { codigo: string }, ack: (r: RespostaEntrada) => void) => void;
  /** Entra numa sala pública com vaga, ou cria uma nova se não houver. */
  'sala:jogarAgora': (dados: DadosPerfil, ack: (r: RespostaEntrada) => void) => void;
  'sala:reconectar': (dados: { codigo: string; token: string }, ack: (r: RespostaEntrada) => void) => void;
  'sala:sair': () => void;
  'sala:configurar': (config: Config) => void;
  'sala:remover': (dados: { jogadorId: string }) => void;
  'jogador:pronto': (dados: { pronto: boolean }) => void;
  'partida:iniciar': () => void;
  'partida:jogarDeNovo': (dados: { voltarParaSala: boolean }) => void;
  'resposta:rascunho': (dados: { categoria: string; texto: string }) => void;
  'rodada:stop': (dados: { respostas: Record<string, string> }) => void;
  'voto:enviar': (dados: { indice: number; jogadorId: string; voto: Voto }) => void;
  'correcao:pronto': (dados: { indice: number }) => void;
  'resultado:pronto': (dados: { rodada: number }) => void;
  'reacao:enviar': (dados: { emoji: Reacao }) => void;
}

/** Eventos que o servidor manda para o navegador. */
export interface ServidorParaCliente {
  /** Retrato completo da sala. Chega sempre que algo muda. */
  'sala:estado': (estado: EstadoSala) => void;
  'sala:erro': (erro: { mensagem: string }) => void;
  /** Avulso, só para a animação "STOP! 3, 2, 1". */
  'rodada:stop': (dados: { jogadorId: string; apelido: string }) => void;
  'reacao': (dados: { id: string; jogadorId: string; emoji: Reacao }) => void;
  'jogador:removido': () => void;
}
