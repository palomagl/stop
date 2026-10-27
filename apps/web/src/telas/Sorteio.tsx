import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ALFABETO, type EstadoSala } from '@rabisco/shared';
import { Tela } from '../componentes/Tela';
import { sons } from '../lib/sons';

/** Intervalos entre as letras: começa rápido e vai freando até parar. */
const PASSOS = Array.from({ length: 16 }, (_, i) => 55 + i * i * 1.3);

export function Sorteio({ sala }: { sala: EstadoSala }) {
  const reduzir = useReducedMotion();
  const letraFinal = sala.letra!;
  const candidatas = ALFABETO.filter((l) => !sala.config.letrasExcluidas.includes(l));
  const [letra, setLetra] = useState(reduzir ? letraFinal : candidatas[0]!);
  const [parou, setParou] = useState(Boolean(reduzir));

  useEffect(() => {
    if (reduzir) {
      sons.letra();
      return;
    }
    let cancelado = false;
    let total = 0;
    const timers = PASSOS.map((espera, i) => {
      total += espera;
      return setTimeout(() => {
        if (cancelado) return;
        if (i === PASSOS.length - 1) {
          setLetra(letraFinal);
          setParou(true);
          sons.letra();
        } else {
          setLetra(candidatas[Math.floor(Math.random() * candidatas.length)]!);
          sons.tique();
        }
      }, total);
    });
    return () => {
      cancelado = true;
      timers.forEach(clearTimeout);
    };
    // A animação roda uma vez por rodada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala.rodada]);

  return (
    <Tela>
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 text-center">
        <p className="font-mao text-3xl text-tinta-suave">
          Rodada {sala.rodada} de {sala.config.rodadas}
        </p>
        <motion.div
          key={parou ? 'parou' : 'girando'}
          initial={parou ? { scale: 0.6, rotate: -20 } : false}
          animate={{ scale: 1, rotate: parou ? -4 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 14 }}
          className="grid size-48 place-items-center rounded-full border-[5px] border-tinta bg-marca-texto shadow-[6px_6px_0_var(--sombra)] sm:size-60"
        >
          <span className="font-mao text-[8rem] font-bold leading-none text-[#1f2a44] sm:text-[10rem]" aria-hidden="true">
            {letra}
          </span>
        </motion.div>
        <p className="font-mao text-3xl font-bold" role="status" aria-live="assertive">
          {parou ? `A letra é ${letraFinal}!` : 'Sorteando a letra…'}
        </p>
      </div>
    </Tela>
  );
}
