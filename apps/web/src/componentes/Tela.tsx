import type { ReactNode } from 'react';

/** Coluna central da tela. No celular ocupa tudo; no monitor fica centralizada e mais estreita. */
export function Tela({ children, rodape, larga = false }: { children: ReactNode; rodape?: ReactNode; larga?: boolean }) {
  const largura = larga ? 'max-w-3xl' : 'max-w-xl';
  return (
    <>
      <main className={`mx-auto w-full ${largura} flex-1 px-4 pb-8 pt-3 sm:px-6`}>{children}</main>
      {rodape && (
        <div className="sticky bottom-0 z-20 border-t-2 border-white/10 bg-[var(--vidro)] backdrop-blur-md">
          <div className={`mx-auto w-full ${largura} px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6`}>
            {rodape}
          </div>
        </div>
      )}
    </>
  );
}
