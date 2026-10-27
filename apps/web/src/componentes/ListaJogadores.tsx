import type { JogadorPublico } from '@rabisco/shared';
import { Avatar } from './Avatar';

interface Props {
  jogadores: JogadorPublico[];
  meuId: string;
  /** Texto do selo de "pronto" (no lobby, na correção, no resultado). */
  rotuloPronto?: string;
  aoRemover?: (jogador: JogadorPublico) => void;
}

export function ListaJogadores({ jogadores, meuId, rotuloPronto = 'pronto', aoRemover }: Props) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2" aria-label="Jogadores na sala">
      {jogadores.map((j) => (
        <li key={j.id} className="flex items-center gap-3 rounded-xl border-2 border-tinta/20 bg-papel px-3 py-2">
          <span className="relative">
            <Avatar id={j.avatar} tamanho={42} className={j.online ? '' : 'opacity-40 grayscale'} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-papel ${
                j.online ? 'bg-[#2fa860]' : 'bg-tinta-suave'
              }`}
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mao text-2xl font-bold leading-normal">
              {j.apelido}
              {j.id === meuId && <span className="font-sans text-sm font-semibold text-tinta-suave"> (você)</span>}
            </span>
            <span className="flex flex-wrap gap-x-2 text-xs font-bold text-tinta-suave">
              {j.dono && <span>👑 dono da sala</span>}
              <span>{j.online ? 'online' : 'fora do ar'}</span>
            </span>
          </span>
          {j.pronto && (
            <span className="-rotate-6 rounded border-2 border-certo px-1.5 text-xs font-black uppercase text-certo">
              ✓ {rotuloPronto}
            </span>
          )}
          {aoRemover && j.id !== meuId && (
            <button
              type="button"
              onClick={() => aoRemover(j)}
              className="grid size-10 place-items-center rounded-full text-lg text-tinta-suave"
              aria-label={`Remover ${j.apelido} da sala`}
            >
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
