import { PONTOS } from './constantes';
import { chaveResposta, normalizar } from './normalizar';
import type { MotivoAnulacao, Voto } from './tipos';

/** Diz se a resposta já chega anulada, antes de qualquer voto. */
export function motivoAnulacaoAutomatica(texto: string, letra: string): MotivoAnulacao | null {
  const resposta = normalizar(texto);
  if (!resposta) return 'vazia';
  const inicial = normalizar(letra);
  if (!resposta.startsWith(inicial)) return 'letra';
  if (resposta.replace(/ /g, '') === inicial) return 'so-letra';
  return null;
}

/** Anulada quando os 👎 passam dos 👍. Empate mantém a resposta. */
export function anuladaPorVotos(votos: Record<string, Voto>): boolean {
  let sim = 0;
  let nao = 0;
  for (const voto of Object.values(votos)) {
    if (voto === 'sim') sim++;
    else nao++;
  }
  return nao > sim;
}

export interface RespostaParaPontuar {
  jogadorId: string;
  texto: string;
  anulada: boolean;
}

/**
 * Pontos de uma categoria: 10 para resposta válida e única,
 * 5 para cada um quando a resposta válida se repete, 0 para vazia ou anulada.
 */
export function pontuarCategoria(respostas: RespostaParaPontuar[]): Record<string, number> {
  const repeticoes = new Map<string, number>();
  for (const r of respostas) {
    if (r.anulada) continue;
    const chave = chaveResposta(r.texto);
    repeticoes.set(chave, (repeticoes.get(chave) ?? 0) + 1);
  }

  const pontos: Record<string, number> = {};
  for (const r of respostas) {
    if (r.anulada) {
      pontos[r.jogadorId] = PONTOS.anulada;
      continue;
    }
    const vezes = repeticoes.get(chaveResposta(r.texto)) ?? 0;
    pontos[r.jogadorId] = vezes > 1 ? PONTOS.repetida : PONTOS.unica;
  }
  return pontos;
}

/** Posição de cada um no placar. Empatados dividem a mesma posição (1, 2, 2, 4). */
export function calcularPosicoes(pontos: Record<string, number>): Record<string, number> {
  const valores = Object.values(pontos);
  const posicoes: Record<string, number> = {};
  for (const [id, p] of Object.entries(pontos)) {
    posicoes[id] = 1 + valores.filter((outro) => outro > p).length;
  }
  return posicoes;
}
