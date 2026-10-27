import type { LinhaRanking, PartidaNoHistorico } from '@rabisco/shared';

export interface PartidaTerminada {
  id: string;
  codigo: string;
  terminouEm: Date;
  rodadas: number;
  categorias: string[];
  letras: string[];
  jogadores: { dispositivo: string; apelido: string; avatar: number; pontos: number; posicao: number }[];
}

/**
 * Onde as partidas terminadas ficam guardadas.
 * Em produção é o Postgres; sem `DATABASE_URL`, fica na memória e some quando o servidor reinicia.
 */
export interface Arquivo {
  readonly persistente: boolean;
  salvarPartida(partida: PartidaTerminada): Promise<void>;
  historico(dispositivo: string, limite: number): Promise<PartidaNoHistorico[]>;
  ranking(dispositivo: string | null, limite: number): Promise<LinhaRanking[]>;
  fechar(): Promise<void>;
}
