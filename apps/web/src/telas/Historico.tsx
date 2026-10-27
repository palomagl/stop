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
      <button type="button" className="chip mb-4 py-1.5 hover:bg-white/20" onClick={aoVoltar}>
        ← Voltar
      </button>
      <h1 className="titulo text-5xl">Minhas partidas</h1>
      <p className="mt-2 mb-5 text-sm font-semibold text-texto-suave">As últimas partidas jogadas neste aparelho.</p>
      <EstadoArquivo estado={estado}>
        {(partidas) =>
          partidas.length === 0 ? (
            <div className="cartao px-6 py-10 text-center"><span className="mb-3 block text-4xl" aria-hidden="true">✦</span><p className="font-titulo text-2xl text-tinta">Nenhuma partida terminada por aqui ainda.</p></div>
          ) : (
            <ul className="flex flex-col gap-3">
              {partidas.map((p) => (
                <li key={p.id} className="cartao p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-titulo text-3xl">
                      {p.minhaPosicao === 1 ? '🏆 Vitória!' : `${p.minhaPosicao}º lugar`}
                    </span>
                    <span className="text-sm font-bold text-tinta-suave">{DATA.format(new Date(p.terminouEm))}</span>
                  </div>
                  <p className="text-sm font-semibold text-tinta-suave">
                    {p.rodadas} {p.rodadas === 1 ? 'rodada' : 'rodadas'} · {p.categorias.length} categorias ·{' '}
                    {p.meusPontos} pts
                  </p>
                  <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {p.jogadores.map((j, i) => (
                      <li key={i} className={`flex items-center gap-1 text-sm ${j.eu ? 'font-black' : 'font-semibold'}`}>
                        <span className="text-tinta-suave">{j.posicao}º</span>
                        <Avatar id={j.avatar} tamanho={26} className="rounded-full" />
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
