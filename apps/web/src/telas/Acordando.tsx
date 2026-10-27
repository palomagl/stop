import { motion, useReducedMotion } from 'framer-motion';
import { IconeLogo } from '../componentes/Logo';

/**
 * O servidor grátis dorme quando fica parado e leva até um minuto para ligar.
 * Esta tela segura a pessoa enquanto isso.
 */
export function Acordando() {
  const reduzir = useReducedMotion();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-8 text-center" role="status" aria-live="polite">
      <motion.div
        animate={reduzir ? undefined : { rotate: [-8, 8, -8], y: [0, -6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <IconeLogo tamanho={96} />
      </motion.div>
      <h1 className="font-mao text-5xl font-bold">Acordando o servidor…</h1>
      <p className="max-w-sm text-tinta-suave">
        Ele tira uma soneca quando ninguém está jogando. A primeira entrada do dia pode levar até um minuto.
      </p>
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-3 rounded-full bg-caneta"
            animate={reduzir ? undefined : { opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </main>
  );
}
