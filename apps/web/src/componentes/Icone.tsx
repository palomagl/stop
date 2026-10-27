import type { ReactNode } from 'react';

type Nome = 'som' | 'mudo' | 'lua' | 'sol' | 'seta' | 'raio' | 'robo';
const DESENHOS: Record<Nome, ReactNode> = {
  seta: <path d="M6 18 18 6M6 6h12v12" />,
  raio: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  robo: <><rect x="4" y="8" width="16" height="12" rx="3.5" /><path d="M12 8V5M9 13v1.5m6-1.5v1.5M9.5 17.5h5M2 13v3m20-3v3" /><circle cx="12" cy="3.6" r="1.4" /></>,
  som: <><path d="M11 4 6 8H3v8h3l5 4V4Z" /><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  mudo: <><path d="M11 4 6 8H3v8h3l5 4V4Z" /><path d="m16 9 6 6m0-6-6 6" /></>,
  lua: <path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z" />,
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
};

export function Icone({ nome }: { nome: Nome }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {DESENHOS[nome]}
    </svg>
  );
}
