/**
 * Vibração curta no celular. Só o Android tem: iPhone e computador ignoram,
 * e o navegador só deixa vibrar depois que a pessoa já tocou na página.
 */
function vibrar(padrao: number | number[]): void {
  try {
    navigator.vibrate?.(padrao);
  } catch {
    // sem suporte: segue sem vibrar
  }
}

export const vibracoes = {
  /** Alguém apertou STOP. */
  stop: () => vibrar([120, 60, 180]),
  /** Cada número do "3, 2, 1". */
  tique: () => vibrar(40),
  /** Faltam 10 segundos. */
  alerta: () => vibrar([60, 50, 60]),
  /** O tempo acabou. */
  fim: () => vibrar(250),
};
