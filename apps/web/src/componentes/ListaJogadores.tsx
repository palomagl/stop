import type { JogadorPublico } from '@rabisco/shared';
import { Avatar } from './Avatar';

interface Props {
  jogadores: JogadorPublico[];
  meuId: string;
  /** Texto do selo de "pronto" (no lobby, na correção, no resultado). */
  rotuloPronto?: string;
  aoRemover?: (jogador: JogadorPublico) => void;
  /** Só em sala pública: deixa denunciar o apelido de outra pessoa. */
  aoDenunciar?: (jogador: JogadorPublico) => void;
}

export function ListaJogadores({ jogadores, meuId, rotuloPronto = 'pronto', aoRemover, aoDenunciar }: Props) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2" aria-label="Jogadores na sala">
      {jogadores.map((j) => (
        <li key={j.id} data-eu={j.id === meuId} className="cartao jogador-card flex items-center gap-3 px-3 py-3">
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
          {aoDenunciar && !aoRemover && j.id !== meuId && (
            <BotaoDenunciar jogador={j} aoDenunciar={aoDenunciar} />
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

/** Bandeirinha de denúncia. Depois de denunciar, fica marcada e não repete. */
export function BotaoDenunciar({
  jogador,
  aoDenunciar,
}: {
  jogador: JogadorPublico;
  aoDenunciar: (jogador: JogadorPublico) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => aoDenunciar(jogador)}
      disabled={jogador.denunciadoPorMim}
      className="grid size-10 shrink-0 place-items-center rounded-full text-lg transition hover:bg-black/5 disabled:opacity-40"
      aria-label={jogador.denunciadoPorMim ? `Você já denunciou ${jogador.apelido}` : `Denunciar o apelido ${jogador.apelido}`}
      title={jogador.denunciadoPorMim ? 'Já denunciado' : 'Denunciar apelido'}
    >
      <span aria-hidden="true">🚩</span>
    </button>
  );
}
