import type { LinhaRanking } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { EstadoArquivo } from '../componentes/EstadoArquivo';
import { Tela } from '../componentes/Tela';
import { useArquivo } from '../lib/useArquivo';

export function Ranking({ aoVoltar }: { aoVoltar: () => void }) {
  const estado = useArquivo<LinhaRanking[]>('/ranking');
  return (
    <Tela>
      <button type="button" className="chip mb-4 py-1.5 hover:bg-white/20" onClick={aoVoltar}>
        ← Voltar
      </button>
      <h1 className="titulo text-5xl">Ranking</h1>
      <p className="mt-2 mb-5 text-sm font-semibold text-texto-suave">Quem mais venceu partidas. No empate, ganha quem fez mais pontos.</p>
      <EstadoArquivo estado={estado}>
        {(linhas) =>
          linhas.length === 0 ? (
            <div className="cartao px-6 py-10 text-center"><span className="mb-3 block text-4xl" aria-hidden="true">🏆</span><p className="font-titulo text-2xl text-tinta">Ninguém terminou uma partida ainda. Que tal ser a primeira pessoa?</p></div>
          ) : (
            <ol className="flex flex-col gap-2">
              {linhas.map((l) => (
                <li
                  key={l.posicao}
                  className={`cartao flex items-center gap-3 px-2.5 py-2 ${l.eu ? 'ring-4 ring-amarelo' : ''}`}
                >
                  <span className="w-9 text-center font-titulo text-3xl">
                    {l.posicao <= 3 ? ['🥇', '🥈', '🥉'][l.posicao - 1] : `${l.posicao}º`}
                  </span>
                  <Avatar id={l.avatar} tamanho={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-extrabold leading-tight">
                      {l.apelido}
                      {l.eu && <span className="font-semibold text-tinta-suave"> (você)</span>}
                    </span>
                    <span className="text-xs font-bold text-tinta-suave">
                      {l.partidas} {l.partidas === 1 ? 'partida' : 'partidas'} · {l.pontos} pts
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-titulo text-3xl leading-none">{l.vitorias}</span>
                    <span className="text-xs font-bold text-tinta-suave">{l.vitorias === 1 ? 'vitória' : 'vitórias'}</span>
                  </span>
                </li>
              ))}
            </ol>
          )
        }
      </EstadoArquivo>
    </Tela>
  );
}
