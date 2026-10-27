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
            initial={{ y: -24, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="pointer-events-auto max-w-sm rounded-2xl border-[3px] border-[#0b1638] bg-amarelo px-4 py-2.5 text-left font-bold text-[#0b1638] shadow-[0_5px_0_#0b1638]"
          >
            {aviso.texto}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
