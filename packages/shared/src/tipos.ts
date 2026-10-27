import type { REACOES } from './constantes';

export type Fase = 'lobby' | 'sorteio' | 'respostas' | 'travando' | 'correcao' | 'resultado' | 'fim';

export type Reacao = (typeof REACOES)[number];

export type Voto = 'sim' | 'nao';

export type MotivoAnulacao = 'vazia' | 'letra' | 'so-letra';

export interface Config {
  categorias: string[];
  rodadas: number;
  tempoRodadaSeg: number;
  letrasExcluidas: string[];
}

export interface JogadorPublico {
  id: string;
  apelido: string;
  avatar: number;
  dono: boolean;
  online: boolean;
  pronto: boolean;
  pontos: number;
  /** Quantos campos a pessoa já preencheu na rodada atual. */
  preenchidas: number;
  /** Falso para quem entrou no meio de uma rodada e espera a próxima. */
  participando: boolean;
}

export interface RespostaEmCorrecao {
  jogadorId: string;
  apelido: string;
  avatar: number;
  texto: string;
  /** Preenchido quando a resposta já chega anulada (vazia, letra errada ou só a letra). */
  motivo: MotivoAnulacao | null;
  votos: Record<string, Voto>;
}

export interface Correcao {
  indice: number;
  categoria: string;
  respostas: RespostaEmCorrecao[];
  prontos: string[];
}

export interface LinhaPlacar {
  jogadorId: string;
  apelido: string;
  avatar: number;
  pontosRodada: number;
  total: number;
  posicao: number;
  posicaoAnterior: number;
}

export interface ResultadoRodada {
  linhas: LinhaPlacar[];
  prontos: string[];
}

export interface ResumoPartida {
  maisVotada: { apelido: string; texto: string; categoria: string; votos: number } | null;
  maisStops: { apelido: string; quantidade: number } | null;
  categoriaMaisErrada: { categoria: string; anuladas: number } | null;
}

export interface FimDePartida {
  classificacao: { jogadorId: string; apelido: string; avatar: number; pontos: number; posicao: number }[];
  resumo: ResumoPartida;
}

/** Retrato completo da sala do ponto de vista de um jogador. */
export interface EstadoSala {
  codigo: string;
  fase: Fase;
  config: Config;
  jogadores: JogadorPublico[];
  meuId: string;
  rodada: number;
  letra: string | null;
  letrasUsadas: string[];
  /** Horário (relógio do servidor) em que a fase atual termina. */
  terminaEm: number | null;
  /** Horário do servidor quando o retrato foi montado, para acertar o relógio do navegador. */
  agora: number;
  stopPor: string | null;
  minhasRespostas: Record<string, string>;
  correcao: Correcao | null;
  resultado: ResultadoRodada | null;
  fim: FimDePartida | null;
}
