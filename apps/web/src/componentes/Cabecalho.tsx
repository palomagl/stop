import { alternarSom, alternarTema, usePreferencias } from '../lib/preferencias';
import { useJogo } from '../lib/jogo';
import { Logo } from './Logo';
import { BotaoReacoes } from './Reacoes';

export function Cabecalho() {
  const { tema, mudo } = usePreferencias();
  const { sala, conexao } = useJogo();

  return (
    <header className="sticky top-0 z-30 border-b-2 border-tinta/15 bg-papel/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 pl-8 pr-2 sm:pl-16">
        <Logo />
        <div className="flex items-center">
          {sala && (
            <span className="mr-1 rounded-md border-2 border-dashed border-tinta/40 px-2 py-0.5 font-mono text-sm font-bold tracking-widest">
              <span className="sr-only">Código da sala: </span>
              {sala.codigo}
            </span>
          )}
          {sala && <BotaoReacoes />}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-xl"
            onClick={alternarSom}
            aria-pressed={mudo}
            aria-label={mudo ? 'Ligar sons' : 'Silenciar sons'}
            title={mudo ? 'Ligar sons' : 'Silenciar sons'}
          >
            <span aria-hidden="true">{mudo ? '🔇' : '🔊'}</span>
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-xl"
            onClick={alternarTema}
            aria-label={tema === 'claro' ? 'Usar tema quadro-negro' : 'Usar tema caderno'}
            title={tema === 'claro' ? 'Tema quadro-negro' : 'Tema caderno'}
          >
            <span aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </div>
      {conexao === 'caiu' && sala && (
        <p role="status" className="bg-errado px-4 py-1 text-center text-sm font-bold text-papel">
          Sem conexão. Tentando voltar… suas respostas estão salvas.
        </p>
      )}
    </header>
  );
}
