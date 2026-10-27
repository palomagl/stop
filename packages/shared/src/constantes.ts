import type { Config } from './tipos';

/** Nome provisório do jogo. Trocar aqui troca em todo lugar. */
export const NOME_DO_JOGO = 'Rabisco';

export const MIN_JOGADORES = 2;
export const MAX_JOGADORES = 10;
export const MAX_APELIDO = 16;
export const MAX_RESPOSTA = 30;
export const MAX_CATEGORIA = 24;
export const MAX_CATEGORIAS = 16;
export const MIN_RODADAS = 1;
export const MAX_RODADAS = 15;
export const MIN_TEMPO_RODADA = 30;
export const MAX_TEMPO_RODADA = 300;
export const TOTAL_AVATARES = 24;

export const TAMANHO_CODIGO = 5;
/** Sem I, L, O e Q: letras que se confundem quando o código é ditado ou lido rápido. */
export const ALFABETO_CODIGO = 'ABCDEFGHJKMNPRSTUVWXYZ';

export const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const REACOES = ['😂', '🤔', '😱', '👏', '🔥'] as const;

export const CATEGORIAS_PADRAO = [
  'Nome',
  'CEP',
  'Animal',
  'Cor',
  'Fruta/Verdura/Legume',
  'Objeto',
  'Comida',
  'Marca',
  'Profissão',
  'Filme/Série/Desenho',
  'Parte do corpo',
  'MSÉ',
];

/** Dicas mostradas embaixo do nome da categoria. */
export const DICAS_CATEGORIA: Record<string, string> = {
  CEP: 'cidade, estado ou país',
  MSÉ: 'minha sogra é…',
};

export const CONFIG_PADRAO: Config = {
  categorias: [...CATEGORIAS_PADRAO],
  rodadas: 5,
  tempoRodadaSeg: 90,
  letrasExcluidas: ['K', 'W', 'Y', 'X', 'Q'],
  publica: false,
};

export const TAMANHO_RANKING = 20;
export const TAMANHO_HISTORICO = 30;

export const PONTOS = {
  unica: 10,
  repetida: 5,
  anulada: 0,
} as const;

/** Durações em milissegundos. O servidor aceita sobrescrever nos testes. */
export const DURACOES = {
  sorteio: 3500,
  trava: 3000,
  /** Folga depois do fim do tempo para os últimos rascunhos chegarem. */
  folgaRespostas: 800,
  correcao: 30_000,
  /** Categoria sem nenhuma resposta para votar passa mais rápido. */
  correcaoSemVotos: 4000,
  resultado: 20_000,
  foraDaPartida: 120_000,
  salaSemNinguem: 30 * 60_000,
};

export type Duracoes = typeof DURACOES;
