import type { PartidaNoHistorico } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { EstadoArquivo } from '../componentes/EstadoArquivo';
import { Tela } from '../componentes/Tela';
import { useArquivo } from '../lib/useArquivo';

const DATA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function Historico({ aoVoltar }: { aoVoltar: () => void }) {
  const estado = useArquivo<PartidaNoHistorico[]>('/historico');
  return (
    <Tela>
      <button type="button" className="mb-3 py-2 font-bold text-tinta-suave underline" onClick={aoVoltar}>
        ← Voltar
      </button>
      <h1 className="font-mao text-5xl font-bold">Minhas partidas</h1>
      <p className="mb-5 text-sm text-tinta-suave">As últimas partidas jogadas neste aparelho.</p>
      <EstadoArquivo estado={estado}>
        {(partidas) =>
          partidas.length === 0 ? (
            <p className="font-mao text-2xl">Nenhuma partida terminada por aqui ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {partidas.map((p) => (
                <li key={p.id} className="cartao p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mao text-3xl font-bold">
                      {p.minhaPosicao === 1 ? '🏆 Vitória!' : `${p.minhaPosicao}º lugar`}
                    </span>
                    <span className="text-sm font-bold text-tinta-suave">{DATA.format(new Date(p.terminouEm))}</span>
                  </div>
                  <p className="text-sm text-tinta-suave">
                    {p.rodadas} {p.rodadas === 1 ? 'rodada' : 'rodadas'} · {p.categorias.length} categorias ·{' '}
                    {p.meusPontos} pts
                  </p>
                  <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {p.jogadores.map((j, i) => (
                      <li key={i} className={`flex items-center gap-1 text-sm ${j.eu ? 'font-black' : 'font-semibold'}`}>
                        <span className="text-tinta-suave">{j.posicao}º</span>
                        <Avatar id={j.avatar} tamanho={22} />
                        {j.apelido} · {j.pontos}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          )
        }
      </EstadoArquivo>
    </Tela>
  );
}
