import { MAX_RESPOSTA, chaveResposta, limparTexto, motivoAnulacaoAutomatica } from '@rabisco/shared';

/** Uma resposta que o robô precisa julgar na correção. */
export interface RespostaParaJulgar {
  categoria: string;
  texto: string;
}

/** O que aparece em /health, para conferir se a IA está ligada. */
export interface SituacaoCerebro {
  ia: boolean;
  modelo?: string;
  ultimoErro?: string | null;
}

/**
 * De onde o robô tira as ideias: a IA (Gemini) ou as listas de palavras do próprio jogo.
 * O resto do robô (tempo de digitação, erros, votos) não muda com o cérebro.
 */
export interface Cerebro {
  /** Para cada categoria, respostas que começam com a letra, da mais comum para a mais rara. */
  pensar(letra: string, categorias: string[]): Promise<string[][]>;
  /** Para cada resposta: vale (true), não vale (false) ou não dá para saber (null). */
  julgar(letra: string, respostas: RespostaParaJulgar[]): Promise<(boolean | null)[]>;
  situacao(): SituacaoCerebro;
}

export const MAX_OPCOES = 8;

/** Fica só o que alguém poderia escrever: começa com a letra, cabe no campo e não se repete. */
export function limparOpcoes(opcoes: unknown, letra: string): string[] {
  if (!Array.isArray(opcoes)) return [];
  const vistas = new Set<string>();
  const limpas: string[] = [];
  for (const bruta of opcoes) {
    if (typeof bruta !== 'string') continue;
    const texto = limparTexto(bruta);
    if (!texto || texto.length > MAX_RESPOSTA || motivoAnulacaoAutomatica(texto, letra)) continue;
    const chave = chaveResposta(texto);
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    limpas.push(texto);
    if (limpas.length >= MAX_OPCOES) break;
  }
  return limpas;
}
