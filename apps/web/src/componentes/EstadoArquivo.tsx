import type { ReactNode } from 'react';
import type { EstadoBusca } from '../lib/useArquivo';

/** Mostra carregando, desligado ou erro; quando os dados chegam, desenha o conteúdo. */
export function EstadoArquivo<T>({ estado, children }: { estado: EstadoBusca<T>; children: (dados: T) => ReactNode }) {
  if (estado.tipo === 'carregando') {
    return (
      <p role="status" className="font-mao text-2xl text-tinta-suave">
        Folheando o caderno…
      </p>
    );
  }
  if (estado.tipo === 'desligado') {
    return (
      <p className="cartao p-4">
        Este servidor não está guardando partidas. Quando ele tiver um banco de dados ligado, o ranking e o histórico
        aparecem aqui.
      </p>
    );
  }
  if (estado.tipo === 'erro') {
    return (
      <p role="alert" className="cartao p-4 font-bold text-errado">
        Não deu para buscar agora. Confere a internet e tenta de novo.
      </p>
    );
  }
  return <>{children(estado.dados)}</>;
}
