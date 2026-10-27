import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

const CORES = ['#e2492f', '#ffd23f', '#2357c9', '#5cc27a', '#b28dff', '#ff9fb7'];

/** Pedacinhos de papel picado caindo. Não aparece para quem desativou animações. */
export function Confete({ quantidade = 70 }: { quantidade?: number }) {
  const reduzir = useReducedMotion();
  const pedacos = useMemo(
    () =>
      Array.from({ length: quantidade }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        atraso: Math.random() * 0.8,
        duracao: 2.2 + Math.random() * 1.8,
        giro: (Math.random() - 0.5) * 720,
        cor: CORES[i % CORES.length],
        largura: 6 + Math.random() * 6,
      })),
    [quantidade],
  );
  if (reduzir) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pedacos.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{ left: `${p.x}%`, width: p.largura, height: p.largura * 0.6, background: p.cor }}
          initial={{ y: -30, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: p.giro, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.duracao, delay: p.atraso, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
