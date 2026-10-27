import type { ReactNode } from 'react';

/** Rostinho padrão: dois olhos e um sorriso, desenhados com a mesma caneta. */
function Rosto({ x = 32, y = 34, escala = 1 }: { x?: number; y?: number; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} stroke="#1f2a44" strokeLinecap="round" fill="#1f2a44">
      <circle cx="-6" cy="-2" r="2.2" stroke="none" />
      <circle cx="6" cy="-2" r="2.2" stroke="none" />
      <path d="M-5 5 Q0 9 5 5" fill="none" strokeWidth="2.2" />
    </g>
  );
}

const TRACO = { stroke: '#1f2a44', strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Doze rabiscos originais. Formas diferentes, para não depender só da cor. */
export const AVATARES: { nome: string; desenho: ReactNode }[] = [
  {
    nome: 'Sol',
    desenho: (
      <>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M32 4v8" {...TRACO} transform={`rotate(${a} 32 32)`} />
        ))}
        <circle cx="32" cy="32" r="16" fill="#ffd23f" {...TRACO} />
        <Rosto />
      </>
    ),
  },
  {
    nome: 'Nuvem',
    desenho: (
      <>
        <path
          d="M16 46c-7 0-10-9-4-13-1-8 8-13 14-9 3-8 16-8 18 1 8-2 13 7 9 13 5 4 1 9-4 8z"
          fill="#cfe6ff"
          {...TRACO}
        />
        <Rosto y={37} />
      </>
    ),
  },
  {
    nome: 'Gota',
    desenho: (
      <>
        <path d="M32 6C24 20 16 28 16 39a16 16 0 0 0 32 0c0-11-8-19-16-33z" fill="#59a5ff" {...TRACO} />
        <Rosto y={40} />
      </>
    ),
  },
  {
    nome: 'Estrela',
    desenho: (
      <>
        <path
          d="M32 5l7.6 16.4 17.9 2-13.3 12.2 3.7 17.6L32 44.4 16.1 53.2l3.7-17.6L6.5 23.4l17.9-2z"
          fill="#ffb238"
          {...TRACO}
        />
        <Rosto y={33} escala={0.85} />
      </>
    ),
  },
  {
    nome: 'Lápis',
    desenho: (
      <>
        <g transform="rotate(-35 32 32)">
          <rect x="22" y="8" width="20" height="36" rx="2" fill="#ffd23f" {...TRACO} />
          <rect x="22" y="4" width="20" height="7" rx="2" fill="#ff8fa3" {...TRACO} />
          <path d="M22 44l10 16 10-16z" fill="#f6d7b0" {...TRACO} />
          <path d="M29 55l3 5 3-5z" fill="#1f2a44" />
          <Rosto y={28} escala={0.8} />
        </g>
      </>
    ),
  },
  {
    nome: 'Borracha',
    desenho: (
      <>
        <rect x="10" y="18" width="44" height="30" rx="6" fill="#ff9fb7" {...TRACO} transform="rotate(-6 32 32)" />
        <path d="M30 18.5v30" {...TRACO} stroke="#1f2a44" transform="rotate(-6 32 32)" />
        <rect x="31" y="18" width="23" height="30" rx="6" fill="#7fb2ff" {...TRACO} transform="rotate(-6 32 32)" />
        <Rosto x={22} y={34} escala={0.8} />
      </>
    ),
  },
  {
    nome: 'Gato',
    desenho: (
      <>
        <path d="M14 26L12 8l14 9M50 26l2-18-14 9" fill="#ff9d5c" {...TRACO} />
        <circle cx="32" cy="36" r="20" fill="#ff9d5c" {...TRACO} />
        <path d="M10 38h10M10 44h10M44 38h10M44 44h10" {...TRACO} strokeWidth={1.8} />
        <Rosto y={37} />
      </>
    ),
  },
  {
    nome: 'Coruja',
    desenho: (
      <>
        <path d="M14 18l6 6M50 18l-6 6" {...TRACO} />
        <ellipse cx="32" cy="36" rx="19" ry="23" fill="#b48a62" {...TRACO} />
        <circle cx="25" cy="30" r="7" fill="#fff" {...TRACO} />
        <circle cx="39" cy="30" r="7" fill="#fff" {...TRACO} />
        <circle cx="25" cy="30" r="2.6" fill="#1f2a44" />
        <circle cx="39" cy="30" r="2.6" fill="#1f2a44" />
        <path d="M29 38l3 4 3-4z" fill="#ffb238" {...TRACO} strokeWidth={1.8} />
      </>
    ),
  },
  {
    nome: 'Cacto',
    desenho: (
      <>
        <path d="M18 34v-8a4 4 0 0 1 8 0v8M46 30v-8a4 4 0 0 0-8 0v8" fill="#5cc27a" {...TRACO} />
        <rect x="22" y="10" width="20" height="44" rx="10" fill="#5cc27a" {...TRACO} />
        <path d="M14 54h36l-4 8H18z" fill="#d9774b" {...TRACO} />
        <Rosto y={30} escala={0.85} />
      </>
    ),
  },
  {
    nome: 'Fantasma',
    desenho: (
      <>
        <path
          d="M14 56V30a18 18 0 0 1 36 0v26l-6-5-6 5-6-5-6 5-6-5z"
          fill="#f4f1ff"
          {...TRACO}
        />
        <Rosto y={32} />
      </>
    ),
  },
  {
    nome: 'Abacate',
    desenho: (
      <>
        <path d="M32 6c-9 0-13 12-17 22-5 12 2 30 17 30s22-18 17-30C45 18 41 6 32 6z" fill="#7cb342" {...TRACO} />
        <path d="M32 14c-6 0-9 9-11 16-3 9 2 20 11 20s14-11 11-20c-2-7-5-16-11-16z" fill="#e6f0a3" />
        <circle cx="32" cy="40" r="7" fill="#9b6a3c" {...TRACO} />
        <Rosto y={25} escala={0.75} />
      </>
    ),
  },
  {
    nome: 'Planeta',
    desenho: (
      <>
        <circle cx="32" cy="32" r="17" fill="#b28dff" {...TRACO} />
        <ellipse cx="32" cy="36" rx="28" ry="7" fill="none" {...TRACO} transform="rotate(-12 32 36)" />
        <Rosto y={30} escala={0.9} />
      </>
    ),
  },
];

export function Avatar({ id, tamanho = 40, className = '' }: { id: number; tamanho?: number; className?: string }) {
  const avatar = AVATARES[id] ?? AVATARES[0]!;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" role="img" aria-label={avatar.nome} className={className}>
      {avatar.desenho}
    </svg>
  );
}
