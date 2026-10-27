import { motion } from 'framer-motion';

/** Carimbo de correção. Sempre com texto e ícone, nunca só a cor. */
export function Carimbo({ tipo, texto }: { tipo: 'certo' | 'errado'; texto: string }) {
  return (
    <motion.span
      initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
      animate={{ scale: 1, opacity: 1, rotate: tipo === 'certo' ? -5 : 5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className={`selo shrink-0 ${tipo === 'certo' ? 'text-certo' : 'text-errado'}`}
    >
      <span aria-hidden="true">{tipo === 'certo' ? '✓' : '✗'}</span>
      {texto}
    </motion.span>
  );
}
