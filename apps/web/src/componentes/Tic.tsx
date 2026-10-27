/**
 * Tic, o mascote do Stopou!: um cronômetro que grita STOP.
 * - "grito": boca aberta, mão levantada e risquinhos de movimento (logo, STOP)
 * - "feliz": sorriso, para telas tranquilas
 * - "dormindo": olhos fechados e "z", para quando o servidor está acordando
 */
type Humor = 'grito' | 'feliz' | 'dormindo';

const AZUL = '#0b1638';

export function Tic({ tamanho = 120, humor = 'grito', className = '' }: { tamanho?: number; humor?: Humor; className?: string }) {
  const comMao = humor === 'grito';
  return (
    <svg
      width={tamanho}
      height={tamanho * (130 / 124)}
      viewBox="-4 0 124 130"
      aria-hidden="true"
      className={className}
    >
      {comMao && (
        <g stroke={AZUL} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M24 72C10 62 6 42 14 30" fill="none" strokeWidth="9" />
          <path d="M24 72C10 62 6 42 14 30" fill="none" stroke="#ff4d3d" strokeWidth="3" />
          <path d="M6 31c-4-8 2-16 8-12l2-8c5-2 8 3 6 8l6-4c5 0 6 6 2 9l2 8c-4 8-18 8-26-1z" fill="#fff8e7" />
        </g>
      )}
      <g stroke={AZUL} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="51" y="6" width="22" height="14" rx="5" fill="#ffd23f" />
        <rect x="57" y="19" width="10" height="9" fill={AZUL} />
        <rect x="94" y="22" width="15" height="11" rx="4" fill="#ffd23f" transform="rotate(42 101 27)" />
        <circle cx="62" cy="76" r="48" fill="#ff4d3d" />
        <circle cx="62" cy="76" r="37" fill="#fff8e7" />
      </g>
      {/* Brilho no aro */}
      <path d="M28 52A42 42 0 0 1 48 34" stroke="#fff" strokeOpacity=".55" strokeWidth="4" fill="none" strokeLinecap="round" />
      <g stroke={AZUL} strokeWidth="3" strokeLinecap="round">
        <path d="M62 43v6M62 103v6M29 76h6M89 76h6" />
      </g>

      {humor === 'dormindo' ? (
        <>
          <path d="M43 70q7 6 14 0M67 70q7 6 14 0" stroke={AZUL} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <ellipse cx="62" cy="90" rx="6" ry="4.5" fill={AZUL} />
          <path d="M96 30h10l-10 11h10M106 12h7l-7 8h7" stroke="#ffd23f" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          {humor === 'grito' ? (
            <path d="M42 56l16 6M82 56l-16 6" stroke={AZUL} strokeWidth="5" strokeLinecap="round" />
          ) : (
            <path d="M43 58q7-5 14 0M67 58q7-5 14 0" stroke={AZUL} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          )}
          <ellipse cx="50" cy="70" rx="6.5" ry="8.5" fill={AZUL} />
          <circle cx="52" cy="67" r="2.4" fill="#fff" />
          <ellipse cx="74" cy="70" rx="6.5" ry="8.5" fill={AZUL} />
          <circle cx="76" cy="67" r="2.4" fill="#fff" />
          {humor === 'grito' ? (
            <>
              <path d="M47 84Q62 108 77 84Z" fill={AZUL} stroke={AZUL} strokeWidth="3" strokeLinejoin="round" />
              <path d="M54 95Q62 102 70 95Q62 90 54 95z" fill="#ff7a8a" />
            </>
          ) : (
            <>
              <path d="M49 85Q62 98 75 85Z" fill={AZUL} stroke={AZUL} strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M56 91Q62 95 68 91Q62 88 56 91z" fill="#ff7a8a" />
            </>
          )}
          <ellipse cx="40" cy="84" rx="5" ry="3" fill="#ff7a8a" opacity=".45" />
          <ellipse cx="84" cy="84" rx="5" ry="3" fill="#ff7a8a" opacity=".45" />
        </>
      )}

      {humor === 'grito' && (
        <path d="M102 52l10-4M105 64h11M102 76l10 4" stroke="#ffd23f" strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  );
}
