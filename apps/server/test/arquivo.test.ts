import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ArquivoEmMemoria } from '../src/arquivo/memoria';
import { ArquivoPostgres } from '../src/arquivo/postgres';
import type { Arquivo, PartidaTerminada } from '../src/arquivo/tipos';

let contador = 0;
function partida(minutos: number, jogadores: [string, string, number, number][]): PartidaTerminada {
  contador++;
  return {
    id: `00000000-0000-4000-8000-${String(contador).padStart(12, '0')}`,
    codigo: 'GATOS',
    terminouEm: new Date(Date.UTC(2026, 9, 1, 12, minutos)),
    rodadas: 3,
    categorias: ['Nome', 'Animal'],
    letras: ['A', 'B', 'C'],
    jogadores: jogadores.map(([dispositivo, apelido, pontos, posicao]) => ({
      dispositivo,
      apelido,
      avatar: 1,
      pontos,
      posicao,
    })),
  };
}

// Um Postgres em WebAssembly para o arquivo todo: ligar leva uns segundos, limpar é instantâneo.
let pglite: PGlite;
beforeAll(async () => {
  pglite = new PGlite();
  await pglite.waitReady;
}, 30_000);
afterAll(() => pglite.close());

async function postgresLimpo(): Promise<Arquivo> {
  const arquivo = await ArquivoPostgres.abrir(pglite);
  await pglite.exec('TRUNCATE partidas CASCADE');
  return arquivo;
}

const implementacoes: [string, () => Promise<Arquivo>][] = [
  ['memória', async () => new ArquivoEmMemoria()],
  ['Postgres (PGlite)', postgresLimpo],
];

describe.each(implementacoes)('arquivo de partidas: %s', (_nome, abrir) => {
  let arquivo: Arquivo;

  it('devolve o histórico do aparelho, da partida mais nova para a mais velha', async () => {
    arquivo = await abrir();
    await arquivo.salvarPartida(partida(1, [['aparelho-ana', 'Ana', 30, 1], ['aparelho-bia', 'Bia', 20, 2]]));
    await arquivo.salvarPartida(partida(2, [['aparelho-bia', 'Bia', 40, 1], ['aparelho-caio', 'Caio', 10, 2]]));
    await arquivo.salvarPartida(partida(3, [['aparelho-ana', 'Aninha', 15, 2], ['aparelho-bia', 'Bia', 25, 1]]));

    const historico = await arquivo.historico('aparelho-ana', 10);
    expect(historico).toHaveLength(2);
    expect(historico.map((p) => p.minhaPosicao)).toEqual([2, 1]);
    expect(historico[0]!.meusPontos).toBe(15);
    expect(historico[0]!.categorias).toEqual(['Nome', 'Animal']);
    expect(historico[0]!.jogadores).toEqual([
      { apelido: 'Bia', avatar: 1, pontos: 25, posicao: 1, eu: false },
      { apelido: 'Aninha', avatar: 1, pontos: 15, posicao: 2, eu: true },
    ]);
  });

  it('respeita o limite do histórico', async () => {
    arquivo = await abrir();
    for (let i = 0; i < 4; i++) {
      await arquivo.salvarPartida(partida(i, [['aparelho-ana', 'Ana', 10, 1], ['aparelho-bia', 'Bia', 5, 2]]));
    }
    expect(await arquivo.historico('aparelho-ana', 3)).toHaveLength(3);
  });

  it('não mostra histórico de outro aparelho', async () => {
    arquivo = await abrir();
    await arquivo.salvarPartida(partida(1, [['aparelho-ana', 'Ana', 30, 1], ['aparelho-bia', 'Bia', 20, 2]]));
    expect(await arquivo.historico('aparelho-zzz', 10)).toEqual([]);
  });

  it('ranking ordena por vitórias, depois pontos, com o apelido mais recente', async () => {
    arquivo = await abrir();
    await arquivo.salvarPartida(partida(1, [['aparelho-ana', 'Ana', 30, 1], ['aparelho-bia', 'Bia', 20, 2]]));
    await arquivo.salvarPartida(partida(2, [['aparelho-bia', 'Bia', 40, 1], ['aparelho-caio', 'Caio', 10, 2]]));
    await arquivo.salvarPartida(partida(3, [['aparelho-ana', 'Aninha', 15, 2], ['aparelho-bia', 'Bia', 25, 1]]));

    const ranking = await arquivo.ranking('aparelho-ana', 10);
    expect(ranking).toEqual([
      { posicao: 1, apelido: 'Bia', avatar: 1, partidas: 3, vitorias: 2, pontos: 85, eu: false },
      { posicao: 2, apelido: 'Aninha', avatar: 1, partidas: 2, vitorias: 1, pontos: 45, eu: true },
      { posicao: 3, apelido: 'Caio', avatar: 1, partidas: 1, vitorias: 0, pontos: 10, eu: false },
    ]);
  });

  it('ranking sem aparelho não marca ninguém como "eu" e respeita o limite', async () => {
    arquivo = await abrir();
    await arquivo.salvarPartida(partida(1, [['aparelho-ana', 'Ana', 30, 1], ['aparelho-bia', 'Bia', 20, 2]]));
    const ranking = await arquivo.ranking(null, 1);
    expect(ranking).toHaveLength(1);
    expect(ranking[0]!.eu).toBe(false);
  });

  it('partida contra robô aparece no histórico, mas não conta no ranking', async () => {
    arquivo = await abrir();
    await arquivo.salvarPartida(partida(1, [['aparelho-ana', 'Ana', 30, 1], ['robo-1234', 'Bip', 10, 2]]));
    await arquivo.salvarPartida(partida(2, [['aparelho-ana', 'Ana', 5, 2], ['aparelho-bia', 'Bia', 20, 1]]));

    expect(await arquivo.historico('aparelho-ana', 10)).toHaveLength(2);
    const ranking = await arquivo.ranking('aparelho-ana', 10);
    expect(ranking.map((l) => [l.apelido, l.partidas, l.vitorias])).toEqual([
      ['Bia', 1, 1],
      ['Ana', 1, 0],
    ]);
  });
});

describe('arquivo Postgres', () => {
  it('conta o mesmo aparelho uma vez só na partida, mesmo com duas abas', async () => {
    const arquivo = await postgresLimpo();
    await arquivo.salvarPartida(
      partida(1, [['aparelho-ana', 'Ana', 30, 1], ['aparelho-ana', 'Ana 2', 20, 2], ['aparelho-bia', 'Bia', 5, 3]]),
    );
    const ranking = await arquivo.ranking(null, 10);
    expect(ranking.map((l) => l.partidas)).toEqual([1, 1]);
  });

  it('pode abrir duas vezes no mesmo banco sem quebrar as tabelas', async () => {
    await postgresLimpo();
    const arquivo = await ArquivoPostgres.abrir(pglite);
    expect(await arquivo.ranking(null, 10)).toEqual([]);
  });
});
