import { NOME_DO_JOGO } from '@rabisco/shared';

/** Placa de "pare" desenhada à mão, com um R rabiscado. Funciona de 16 px a tela inteira. */
export function IconeLogo({ tamanho = 40, className = '' }: { tamanho?: number; className?: string }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <path
        d="M21 4h22l17 17v22L43 60H21L4 43V21z"
        fill="#e2492f"
        stroke="var(--tinta)"
        strokeWidth="3"
        strokeLinejoin="round"
        transform="rotate(-6 32 32)"
      />
      <path
        d="M23 47V18c6-2 16-2 17 5 1 7-8 9-16 9 7 2 12 8 16 14"
        fill="none"
        stroke="#fff"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <span className={`inline-flex items-center ${grande ? 'gap-3' : 'gap-2'}`}>
      <IconeLogo tamanho={grande ? 84 : 34} className={grande ? '-rotate-3' : ''} />
      <span className="relative inline-block">
        <span className={`font-mao font-bold leading-none ${grande ? 'text-7xl sm:text-8xl' : 'text-3xl'}`}>
          {NOME_DO_JOGO}
        </span>
        {/* Sublinhado rabiscado de caneta */}
        <svg
          viewBox="0 0 200 16"
          preserveAspectRatio="none"
          aria-hidden="true"
          className={`absolute left-0 w-full ${grande ? '-bottom-3 h-4' : '-bottom-1.5 h-2'}`}
        >
          <path
            d="M3 10 C 40 4, 80 13, 120 7 S 180 5, 197 9"
            fill="none"
            stroke="var(--stop)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </span>
  );
}
