import type { ReactNode } from 'react';
import type { EstadoBusca } from '../lib/useArquivo';
import { Tic } from './Tic';

/** Mostra carregando, desligado ou erro; quando os dados chegam, desenha o conteúdo. */
export function EstadoArquivo<T>({ estado, children }: { estado: EstadoBusca<T>; children: (dados: T) => ReactNode }) {
  if (estado.tipo === 'carregando') {
    return (
      <p role="status" className="titulo py-8 text-center text-2xl">
        Buscando…
      </p>
    );
  }
  if (estado.tipo === 'desligado') {
    return (
      <div className="cartao estado-vazio flex flex-col items-center gap-4 px-6 py-8 text-center">
        <Tic tamanho={56} humor="dormindo" className="opacity-90" />
        <p className="font-semibold">
          Este servidor não está guardando partidas. Quando ele tiver um banco de dados ligado, o ranking e o histórico
          aparecem aqui.
        </p>
      </div>
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
