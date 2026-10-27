import { useEffect, useState } from 'react';
import { useJogo } from './jogo';

function restanteAte(terminaEm: number | null, diferencaRelogio: number) {
  return terminaEm === null ? 0 : Math.max(0, terminaEm - (Date.now() + diferencaRelogio));
}

/**
 * Milissegundos até `terminaEm`, contados no relógio do servidor.
 * O navegador só desenha: quem decide quando a fase acaba é o servidor.
 */
export function useTempoRestante(terminaEm: number | null): number {
  const { diferencaRelogio } = useJogo();
  const [restante, setRestante] = useState(() => restanteAte(terminaEm, diferencaRelogio));

  useEffect(() => {
    const atualizar = () => setRestante(restanteAte(terminaEm, diferencaRelogio));
    atualizar();
    const id = setInterval(atualizar, 200);
    return () => clearInterval(id);
  }, [terminaEm, diferencaRelogio]);

  return restante;
}
