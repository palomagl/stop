import type { LinhaRanking } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { EstadoArquivo } from '../componentes/EstadoArquivo';
import { Tela } from '../componentes/Tela';
import { useArquivo } from '../lib/useArquivo';

export function Ranking({ aoVoltar }: { aoVoltar: () => void }) {
  const estado = useArquivo<LinhaRanking[]>('/ranking');
  return (
    <Tela>
      <button type="button" className="mb-3 py-2 font-bold text-tinta-suave underline" onClick={aoVoltar}>
        ← Voltar
      </button>
      <h1 className="font-mao text-5xl font-bold">Ranking</h1>
      <p className="mb-5 text-sm text-tinta-suave">Quem mais venceu partidas. No empate, ganha quem fez mais pontos.</p>
      <EstadoArquivo estado={estado}>
        {(linhas) =>
          linhas.length === 0 ? (
            <p className="font-mao text-2xl">Ninguém terminou uma partida ainda. Que tal ser a primeira pessoa?</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {linhas.map((l) => (
                <li
                  key={l.posicao}
                  className={`flex items-center gap-3 rounded-xl border-2 bg-papel px-3 py-2 ${
                    l.eu ? 'border-caneta' : 'border-tinta/20'
                  }`}
                >
                  <span className="w-9 text-center font-mao text-3xl font-bold">
                    {l.posicao <= 3 ? ['🥇', '🥈', '🥉'][l.posicao - 1] : `${l.posicao}º`}
                  </span>
                  <Avatar id={l.avatar} tamanho={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {l.apelido}
                      {l.eu && <span className="font-semibold text-tinta-suave"> (você)</span>}
                    </span>
                    <span className="text-xs font-bold text-tinta-suave">
                      {l.partidas} {l.partidas === 1 ? 'partida' : 'partidas'} · {l.pontos} pts
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mao text-3xl font-bold leading-none">{l.vitorias}</span>
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
