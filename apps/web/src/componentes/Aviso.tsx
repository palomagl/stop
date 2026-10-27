import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { fecharAviso, useJogo } from '../lib/jogo';

export function Aviso() {
  const { aviso } = useJogo();

  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => fecharAviso(aviso.id), 3500);
    return () => clearTimeout(id);
  }, [aviso]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {aviso && (
          <motion.button
            key={aviso.id}
            type="button"
            onClick={() => fecharAviso(aviso.id)}
            initial={{ y: -20, opacity: 0, rotate: -2 }}
            animate={{ y: 0, opacity: 1, rotate: -1 }}
            exit={{ y: -20, opacity: 0 }}
            className="pointer-events-auto max-w-sm rounded-lg border-2 border-tinta bg-marca-texto px-4 py-2 text-left font-bold text-[#1f2a44] shadow-[3px_3px_0_var(--sombra)]"
          >
            {aviso.texto}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
