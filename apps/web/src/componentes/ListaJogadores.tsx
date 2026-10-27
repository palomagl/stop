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
    <ul className="grid gap-2.5 sm:grid-cols-2" aria-label="Jogadores na sala">
      {jogadores.map((j) => (
        <li key={j.id} className="cartao flex items-center gap-3 px-2.5 py-2">
          <span className="relative">
            <Avatar id={j.avatar} tamanho={48} className={j.online ? '' : 'opacity-40 grayscale'} />
            <span
              className={`absolute -bottom-1 -right-1 size-4 rounded-full border-[3px] border-[var(--cartao)] ${
                j.online ? 'bg-menta' : 'bg-tinta-suave'
              }`}
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-extrabold leading-tight">
              {j.apelido}
              {j.id === meuId && <span className="text-sm font-semibold text-tinta-suave"> (você)</span>}
            </span>
            <span className="flex flex-wrap gap-x-2 text-xs font-bold text-tinta-suave">
              {j.dono && <span>👑 dono da sala</span>}
              <span>{j.online ? 'online' : 'fora do ar'}</span>
            </span>
          </span>
          {j.pronto && (
            <span className="selo -rotate-6 text-certo">
              <span aria-hidden="true">✓</span> {rotuloPronto}
            </span>
          )}
          {aoRemover && j.id !== meuId && (
            <button
              type="button"
              onClick={() => aoRemover(j)}
              className="grid size-10 place-items-center rounded-full text-lg font-bold text-tinta-suave hover:bg-black/5"
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
