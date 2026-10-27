import { NOME_DO_JOGO } from '@rabisco/shared';
import { Tic } from './Tic';

/** Palavra do logo: amarela, com contorno grosso e sombra dura, levemente inclinada. */
function Palavra({ tamanho }: { tamanho: string }) {
  return (
    <span
      className={`inline-block -rotate-3 font-titulo leading-[0.9] tracking-[0.01em] text-amarelo ${tamanho}`}
      style={{
        WebkitTextStroke: '0.16em #0b1638',
        paintOrder: 'stroke fill',
        textShadow: '0 0.1em 0 #0b1638',
      }}
    >
      {NOME_DO_JOGO.toUpperCase()}
    </span>
  );
}

export function Logo({ grande = false }: { grande?: boolean }) {
  if (!grande) {
    return (
      <span className="inline-flex items-center gap-1.5" aria-label={NOME_DO_JOGO}>
        <Tic tamanho={34} humor="feliz" />
        <span aria-hidden="true">
          <Palavra tamanho="text-[1.7rem]" />
        </span>
      </span>
    );
  }

  return (
    <span className="relative inline-flex flex-col items-center" aria-label={`${NOME_DO_JOGO} Adedonha online`}>
      <Tic tamanho={150} className="-mb-6" />
      <span aria-hidden="true" className="relative">
        <Palavra tamanho="text-[4.6rem] sm:text-[5.5rem]" />
      </span>
      <span
        aria-hidden="true"
        className="mt-1 -rotate-3 rounded-xl border-[3px] border-[#0b1638] bg-coral px-4 py-0.5 font-titulo text-lg tracking-[0.08em] text-white shadow-[0_4px_0_#0b1638]"
      >
        ADEDONHA ONLINE
      </span>
    </span>
  );
}
