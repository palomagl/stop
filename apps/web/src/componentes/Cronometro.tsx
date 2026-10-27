import { useEffect, useRef, useState } from 'react';
import { useTempoRestante } from '../lib/relogio';

/** Momentos anunciados para leitores de tela. Fora deles, o cronômetro fica em silêncio. */
const MARCOS = [30, 10, 0];

export function Cronometro({ terminaEm, grande = false }: { terminaEm: number | null; grande?: boolean }) {
  const restante = useTempoRestante(terminaEm);
  const segundos = Math.ceil(restante / 1000);
  const [anuncio, setAnuncio] = useState('');
  const anunciados = useRef(new Set<number>());

  useEffect(() => {
    anunciados.current = new Set();
  }, [terminaEm]);

  useEffect(() => {
    for (const marco of MARCOS) {
      if (segundos <= marco && !anunciados.current.has(marco)) {
        anunciados.current.add(marco);
        // Só anuncia o marco que está acontecendo agora, não os que já passaram ao abrir a tela.
        if (segundos === marco) setAnuncio(marco === 0 ? 'Tempo esgotado!' : `Faltam ${marco} segundos`);
      }
    }
  }, [segundos]);

  const urgente = segundos <= 10;
  const minutos = Math.floor(segundos / 60);
  const texto = minutos > 0 ? `${minutos}:${String(segundos % 60).padStart(2, '0')}` : String(segundos);

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`inline-block font-mao font-bold tabular-nums leading-none ${grande ? 'text-5xl' : 'text-3xl'} ${
          urgente ? 'text-errado' : 'text-tinta'
        } ${urgente && segundos > 0 ? 'pulsando' : ''}`}
      >
        {texto}
      </span>
      <span className="sr-only">Cronômetro</span>
      <span className="sr-only" role="status" aria-live="assertive">
        {anuncio}
      </span>
    </div>
  );
}
