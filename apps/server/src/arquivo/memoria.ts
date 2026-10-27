import type { LinhaRanking, PartidaNoHistorico } from '@rabisco/shared';
import type { Arquivo, PartidaTerminada } from './tipos';

export class ArquivoEmMemoria implements Arquivo {
  readonly persistente = false;
  private partidas: PartidaTerminada[] = [];

  async salvarPartida(partida: PartidaTerminada): Promise<void> {
    this.partidas.push(structuredClone(partida));
  }

  async historico(dispositivo: string, limite: number): Promise<PartidaNoHistorico[]> {
    return this.partidas
      .filter((p) => p.jogadores.some((j) => j.dispositivo === dispositivo))
      .sort((a, b) => b.terminouEm.getTime() - a.terminouEm.getTime())
      .slice(0, limite)
      .map((p) => {
        const eu = p.jogadores.find((j) => j.dispositivo === dispositivo)!;
        return {
          id: p.id,
          terminouEm: p.terminouEm.toISOString(),
          rodadas: p.rodadas,
          categorias: p.categorias,
          minhaPosicao: eu.posicao,
          meusPontos: eu.pontos,
          jogadores: [...p.jogadores]
            .sort((a, b) => a.posicao - b.posicao || a.apelido.localeCompare(b.apelido))
            .map((j) => ({
              apelido: j.apelido,
              avatar: j.avatar,
              pontos: j.pontos,
              posicao: j.posicao,
              eu: j.dispositivo === dispositivo,
            })),
        };
      });
  }

  async ranking(dispositivo: string | null, limite: number): Promise<LinhaRanking[]> {
    const porDispositivo = new Map<string, Omit<LinhaRanking, 'posicao' | 'eu'> & { ultima: number }>();
    for (const partida of this.partidas) {
      for (const j of partida.jogadores) {
        const atual = porDispositivo.get(j.dispositivo) ?? {
          apelido: j.apelido,
          avatar: j.avatar,
          partidas: 0,
          vitorias: 0,
          pontos: 0,
          ultima: 0,
        };
        atual.partidas++;
        if (j.posicao === 1) atual.vitorias++;
        atual.pontos += j.pontos;
        // O ranking mostra o apelido mais recente de cada aparelho.
        if (partida.terminouEm.getTime() >= atual.ultima) {
          atual.ultima = partida.terminouEm.getTime();
          atual.apelido = j.apelido;
          atual.avatar = j.avatar;
        }
        porDispositivo.set(j.dispositivo, atual);
      }
    }
    return [...porDispositivo.entries()]
      .sort(([, a], [, b]) => b.vitorias - a.vitorias || b.pontos - a.pontos || a.apelido.localeCompare(b.apelido))
      .slice(0, limite)
      .map(([id, l], i) => ({
        posicao: i + 1,
        apelido: l.apelido,
        avatar: l.avatar,
        partidas: l.partidas,
        vitorias: l.vitorias,
        pontos: l.pontos,
        eu: id === dispositivo,
      }));
  }

  async fechar(): Promise<void> {}
}
