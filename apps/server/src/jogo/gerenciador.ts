import { ALFABETO_CODIGO, TAMANHO_CODIGO, contemPalavrao } from '@rabisco/shared';
import { Sala, type OpcoesSala } from './sala';

export class GerenciadorDeSalas {
  private readonly salas = new Map<string, Sala>();

  constructor(
    private readonly opcoes: OpcoesSala,
    private readonly aoCriarSala: (sala: Sala) => void,
  ) {}

  get total(): number {
    return this.salas.size;
  }

  buscar(codigo: string): Sala | undefined {
    return this.salas.get(codigo);
  }

  criar(): Sala {
    const sala = new Sala(this.gerarCodigo(), this.opcoes);
    this.salas.set(sala.codigo, sala);
    sala.once('vazia', () => this.salas.delete(sala.codigo));
    this.aoCriarSala(sala);
    return sala;
  }

  /** Apaga salas em que ninguém está conectado há mais tempo que o limite. */
  limparAbandonadas(agora = Date.now()): void {
    for (const sala of this.salas.values()) {
      if (sala.semNinguemDesde !== null && agora - sala.semNinguemDesde >= this.opcoes.duracoes.salaSemNinguem) {
        this.salas.delete(sala.codigo);
        sala.destruir();
      }
    }
  }

  fechar(): void {
    for (const sala of this.salas.values()) sala.destruir();
    this.salas.clear();
  }

  private gerarCodigo(): string {
    for (;;) {
      let codigo = '';
      for (let i = 0; i < TAMANHO_CODIGO; i++) {
        codigo += ALFABETO_CODIGO[Math.floor(this.opcoes.aleatorio() * ALFABETO_CODIGO.length)];
      }
      if (!this.salas.has(codigo) && !contemPalavrao(codigo)) return codigo;
    }
  }
}
