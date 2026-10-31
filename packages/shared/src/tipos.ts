import type { NIVEIS_ROBO, REACOES } from './constantes';

export type Fase = 'lobby' | 'sorteio' | 'respostas' | 'travando' | 'correcao' | 'resultado' | 'fim';

export type Reacao = (typeof REACOES)[number];

export type Voto = 'sim' | 'nao';

export type MotivoAnulacao = 'vazia' | 'letra' | 'so-letra';

export type NivelRobo = (typeof NIVEIS_ROBO)[number];

export interface Config {
  categorias: string[];
  rodadas: number;
  tempoRodadaSeg: number;
  letrasExcluidas: string[];
  /** Sala pública: aparece para quem toca em "Jogar agora". */
  publica: boolean;
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
  /** Se quem está vendo já denunciou o apelido dessa pessoa. */
  denunciadoPorMim: boolean;
  /** Nível do robô, ou null para gente de verdade. */
  robo: NivelRobo | null;
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

/** Uma categoria da folha da rodada: o que cada pessoa escreveu e quanto valeu. */
export interface FolhaCategoria {
  categoria: string;
  respostas: {
    jogadorId: string;
    apelido: string;
    avatar: number;
    texto: string;
    pontos: number;
    anulada: boolean;
  }[];
}

export interface ResultadoRodada {
  linhas: LinhaPlacar[];
  /** Todas as respostas da rodada, categoria por categoria. */
  folha: FolhaCategoria[];
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
  /** Letra que a sala acabou de pular nesta rodada, para avisar no sorteio. */
  letraPulada: string | null;
  /** Votação para pular a letra (só durante as respostas). */
  pularLetra: {
    disponivel: boolean;
    votos: number;
    necessarios: number;
    euVotei: boolean;
  };
  minhasRespostas: Record<string, string>;
  correcao: Correcao | null;
  resultado: ResultadoRodada | null;
  fim: FimDePartida | null;
}

/** Uma partida terminada, do ponto de vista de quem pergunta. */
export interface PartidaNoHistorico {
  id: string;
  terminouEm: string;
  rodadas: number;
  categorias: string[];
  minhaPosicao: number;
  meusPontos: number;
  jogadores: { apelido: string; avatar: number; pontos: number; posicao: number; eu: boolean }[];
}

export interface LinhaRanking {
  posicao: number;
  apelido: string;
  avatar: number;
  partidas: number;
  vitorias: number;
  pontos: number;
  eu: boolean;
}

/** Resposta das rotas de histórico e ranking. `ativo` é falso quando o servidor roda sem banco. */
export type RespostaArquivo<T> = { ativo: true; dados: T } | { ativo: false };
