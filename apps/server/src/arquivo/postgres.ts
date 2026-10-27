import type { LinhaRanking, PartidaNoHistorico } from '@rabisco/shared';
import type { Arquivo, PartidaTerminada } from './tipos';

/** O mínimo que o arquivo precisa de um banco. Serve tanto para o `pg` quanto para o PGlite dos testes. */
export interface Banco {
  query<T = Record<string, unknown>>(sql: string, parametros?: unknown[]): Promise<{ rows: T[] }>;
  exec?(sql: string): Promise<unknown>;
  end?(): Promise<void>;
  close?(): Promise<void>;
}

const MIGRACAO = `
CREATE TABLE IF NOT EXISTS partidas (
  id uuid PRIMARY KEY,
  codigo text NOT NULL,
  terminou_em timestamptz NOT NULL,
  rodadas integer NOT NULL,
  categorias text[] NOT NULL,
  letras text[] NOT NULL
);

CREATE TABLE IF NOT EXISTS participacoes (
  partida_id uuid NOT NULL REFERENCES partidas (id) ON DELETE CASCADE,
  dispositivo text NOT NULL,
  apelido text NOT NULL,
  avatar integer NOT NULL,
  pontos integer NOT NULL,
  posicao integer NOT NULL,
  PRIMARY KEY (partida_id, dispositivo)
);

CREATE INDEX IF NOT EXISTS participacoes_dispositivo ON participacoes (dispositivo);
`;

export class ArquivoPostgres implements Arquivo {
  readonly persistente = true;

  private constructor(private readonly banco: Banco) {}

  /** Conecta e cria as tabelas, se ainda não existirem. */
  static async abrir(banco: Banco): Promise<ArquivoPostgres> {
    if (banco.exec) await banco.exec(MIGRACAO);
    else await banco.query(MIGRACAO);
    return new ArquivoPostgres(banco);
  }

  /** Um comando só, então a partida e as participações entram juntas ou nada entra. */
  async salvarPartida(partida: PartidaTerminada): Promise<void> {
    // Um aparelho aparece uma vez por partida, mesmo que tenha aberto duas abas.
    const jogadores = [...new Map(partida.jogadores.map((j) => [j.dispositivo, j])).values()];
    await this.banco.query(
      `WITH nova AS (
         INSERT INTO partidas (id, codigo, terminou_em, rodadas, categorias, letras)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id
       )
       INSERT INTO participacoes (partida_id, dispositivo, apelido, avatar, pontos, posicao)
       SELECT nova.id, j.dispositivo, j.apelido, j.avatar, j.pontos, j.posicao
         FROM nova,
              json_to_recordset($7::json) AS j(dispositivo text, apelido text, avatar integer, pontos integer, posicao integer)`,
      [
        partida.id,
        partida.codigo,
        partida.terminouEm,
        partida.rodadas,
        partida.categorias,
        partida.letras,
        JSON.stringify(jogadores),
      ],
    );
  }

  async historico(dispositivo: string, limite: number): Promise<PartidaNoHistorico[]> {
    const { rows } = await this.banco.query<{
      id: string;
      terminou_em: Date | string;
      rodadas: number;
      categorias: string[];
      jogadores: { apelido: string; avatar: number; pontos: number; posicao: number; eu: boolean }[];
    }>(
      `SELECT p.id, p.terminou_em, p.rodadas, p.categorias,
              json_agg(json_build_object(
                'apelido', todos.apelido, 'avatar', todos.avatar, 'pontos', todos.pontos,
                'posicao', todos.posicao, 'eu', todos.dispositivo = $1
              ) ORDER BY todos.posicao, todos.apelido) AS jogadores
         FROM partidas p
         JOIN participacoes minha ON minha.partida_id = p.id AND minha.dispositivo = $1
         JOIN participacoes todos ON todos.partida_id = p.id
        GROUP BY p.id
        ORDER BY p.terminou_em DESC
        LIMIT $2`,
      [dispositivo, limite],
    );
    return rows.map((r) => {
      const jogadores = typeof r.jogadores === 'string' ? JSON.parse(r.jogadores) : r.jogadores;
      const eu = jogadores.find((j: { eu: boolean }) => j.eu)!;
      return {
        id: r.id,
        terminouEm: new Date(r.terminou_em).toISOString(),
        rodadas: r.rodadas,
        categorias: r.categorias,
        minhaPosicao: eu.posicao,
        meusPontos: eu.pontos,
        jogadores,
      };
    });
  }

  async ranking(dispositivo: string | null, limite: number): Promise<LinhaRanking[]> {
    const { rows } = await this.banco.query<{
      apelido: string;
      avatar: number;
      partidas: number | string;
      vitorias: number | string;
      pontos: number | string;
      eu: boolean;
    }>(
      `SELECT (array_agg(pa.apelido ORDER BY p.terminou_em DESC))[1] AS apelido,
              (array_agg(pa.avatar ORDER BY p.terminou_em DESC))[1] AS avatar,
              count(*) AS partidas,
              count(*) FILTER (WHERE pa.posicao = 1) AS vitorias,
              sum(pa.pontos) AS pontos,
              pa.dispositivo = $1 AS eu
         FROM participacoes pa
         JOIN partidas p ON p.id = pa.partida_id
        GROUP BY pa.dispositivo
        ORDER BY vitorias DESC, pontos DESC, apelido
        LIMIT $2`,
      [dispositivo ?? '', limite],
    );
    // count e sum voltam como texto no pg (bigint); Number resolve sem perder nada nesta escala.
    return rows.map((r, i) => ({
      posicao: i + 1,
      apelido: r.apelido,
      avatar: Number(r.avatar),
      partidas: Number(r.partidas),
      vitorias: Number(r.vitorias),
      pontos: Number(r.pontos),
      eu: r.eu,
    }));
  }

  async fechar(): Promise<void> {
    if (this.banco.end) await this.banco.end();
    else if (this.banco.close) await this.banco.close();
  }
}
