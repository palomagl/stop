import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { REACOES } from '@rabisco/shared';
import { acoes, useJogo } from '../lib/jogo';

/** Emojis que sobem pela tela de todo mundo. */
export function ReacoesFlutuando() {
  const { reacoes } = useJogo();
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {reacoes.map((r) => (
          <motion.div
            key={r.id}
            className="absolute bottom-24 flex flex-col items-center"
            style={{ left: `${r.x * 100}%` }}
            initial={{ y: 0, opacity: 0, scale: 0.5 }}
            animate={{ y: -320, opacity: [0, 1, 1, 0], scale: 1, x: [0, 12, -10, 6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, ease: 'easeOut' }}
          >
            <span className="text-5xl">{r.emoji}</span>
            <span className="chip bg-[var(--vidro)] text-sm">{r.apelido}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const NOMES: Record<string, string> = {
  '😂': 'rindo',
  '🤔': 'pensando',
  '😱': 'chocado',
  '👏': 'aplausos',
  '🔥': 'fogo',
};

/** Botão que abre a barrinha de reações. */
export function BotaoReacoes() {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full text-2xl transition hover:bg-white/10 active:scale-90"
        aria-expanded={aberto}
        aria-label="Reagir"
        onClick={() => setAberto((a) => !a)}
      >
        <span aria-hidden="true">😀</span>
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="cartao absolute right-0 top-12 z-50 flex gap-1 p-1.5"
          >
            {REACOES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="grid size-11 place-items-center rounded-xl text-2xl transition hover:bg-black/5 active:scale-90"
                aria-label={`Reagir: ${NOMES[emoji]}`}
                onClick={() => acoes.reagir(emoji)}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
