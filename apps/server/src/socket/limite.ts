/** Balde de fichas: cada evento gasta uma, e elas voltam aos poucos. */
export class LimiteDeEventos {
  private fichas: number;
  private ultimaRecarga = Date.now();

  constructor(
    private readonly capacidade = 30,
    private readonly porSegundo = 15,
  ) {
    this.fichas = capacidade;
  }

  permitir(): boolean {
    const agora = Date.now();
    this.fichas = Math.min(this.capacidade, this.fichas + ((agora - this.ultimaRecarga) / 1000) * this.porSegundo);
    this.ultimaRecarga = agora;
    if (this.fichas < 1) return false;
    this.fichas--;
    return true;
  }
}
