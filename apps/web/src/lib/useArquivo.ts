import { useEffect, useState } from 'react';
import { buscarArquivo } from './jogo';

export type EstadoBusca<T> =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; dados: T }
  | { tipo: 'desligado' }
  | { tipo: 'erro' };

/** Busca o ranking ou o histórico no servidor. */
export function useArquivo<T>(rota: '/ranking' | '/historico'): EstadoBusca<T> {
  const [estado, setEstado] = useState<EstadoBusca<T>>({ tipo: 'carregando' });
  useEffect(() => {
    let ativo = true;
    buscarArquivo<T>(rota)
      .then((r) => ativo && setEstado(r.ativo ? { tipo: 'pronto', dados: r.dados } : { tipo: 'desligado' }))
      .catch(() => ativo && setEstado({ tipo: 'erro' }));
    return () => {
      ativo = false;
    };
  }, [rota]);
  return estado;
}
