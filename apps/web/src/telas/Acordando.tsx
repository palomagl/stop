import { motion, useReducedMotion } from 'framer-motion';
import { Tic } from '../componentes/Tic';

/**
 * O servidor grátis dorme quando fica parado e leva até um minuto para ligar.
 * Esta tela segura a pessoa enquanto isso, com o Tic tirando um cochilo.
 */
export function Acordando() {
  const reduzir = useReducedMotion();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-8 text-center" role="status" aria-live="polite">
      <motion.div
        animate={reduzir ? undefined : { rotate: [-4, 4, -4], y: [0, -8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Tic tamanho={150} humor="dormindo" />
      </motion.div>
      <h1 className="titulo text-4xl">Acordando o servidor…</h1>
      <p className="max-w-sm font-semibold text-texto-suave">
        O Tic tira um cochilo quando ninguém está jogando. A primeira entrada depois disso pode levar até um minuto.
      </p>
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-3.5 rounded-full border-2 border-[#0b1638] bg-amarelo"
            animate={reduzir ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </main>
  );
}
