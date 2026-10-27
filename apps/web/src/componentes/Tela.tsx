import type { ReactNode } from 'react';

/** Coluna central com as margens da folha. No celular ocupa tudo; no monitor fica centralizada. */
export function Tela({ children, rodape }: { children: ReactNode; rodape?: ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 pb-6 pl-9 pr-4 pt-4 sm:pl-20 sm:pr-8">{children}</main>
      {rodape && (
        <div className="sticky bottom-0 z-20 border-t-2 border-tinta/15 bg-papel/95 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl py-3 pl-9 pr-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pl-20 sm:pr-8">
            {rodape}
          </div>
        </div>
      )}
    </>
  );
}
