import { motion } from 'framer-motion';

/** Carimbo de correção. Sempre com texto e ícone, nunca só a cor. */
export function Carimbo({ tipo, texto }: { tipo: 'certo' | 'errado'; texto: string }) {
  const cor = tipo === 'certo' ? 'var(--certo)' : 'var(--errado)';
  return (
    <motion.span
      initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
      animate={{ scale: 1, opacity: 1, rotate: tipo === 'certo' ? -6 : 8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border-[3px] px-2 py-0.5 text-xs font-black uppercase tracking-wider"
      style={{ color: cor, borderColor: cor }}
    >
      <span aria-hidden="true">{tipo === 'certo' ? '✓' : '✗'}</span>
      {texto}
    </motion.span>
  );
}
