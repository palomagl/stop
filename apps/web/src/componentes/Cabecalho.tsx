import { alternarSom, alternarTema, usePreferencias } from '../lib/preferencias';
import { useJogo } from '../lib/jogo';
import { Logo } from './Logo';
import { BotaoReacoes } from './Reacoes';

const BOTAO_ICONE = 'grid size-11 place-items-center rounded-full text-xl transition hover:bg-white/10 active:scale-90';

export function Cabecalho() {
  const { tema, mudo } = usePreferencias();
  const { sala, conexao } = useJogo();

  return (
    <header className="sticky top-0 z-30 border-b-2 border-white/10 bg-[var(--vidro)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 pl-3 pr-1 sm:px-6">
        <Logo />
        <div className="flex items-center">
          {sala && (
            <span className="chip mr-1 font-titulo text-[0.95rem] tracking-[0.18em]">
              <span className="sr-only">Código da sala: </span>
              {sala.codigo}
            </span>
          )}
          {sala && <BotaoReacoes />}
          <button
            type="button"
            className={BOTAO_ICONE}
            onClick={alternarSom}
            aria-pressed={mudo}
            aria-label={mudo ? 'Ligar sons' : 'Silenciar sons'}
            title={mudo ? 'Ligar sons' : 'Silenciar sons'}
          >
            <span aria-hidden="true">{mudo ? '🔇' : '🔊'}</span>
          </button>
          <button
            type="button"
            className={BOTAO_ICONE}
            onClick={alternarTema}
            aria-label={tema === 'claro' ? 'Usar tema noite' : 'Usar tema dia'}
            title={tema === 'claro' ? 'Tema noite' : 'Tema dia'}
          >
            <span aria-hidden="true">{tema === 'claro' ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </div>
      {conexao === 'caiu' && sala && (
        <p role="status" className="bg-coral px-4 py-1 text-center text-sm font-bold text-white">
          Sem conexão. Tentando voltar… suas respostas estão salvas.
        </p>
      )}
    </header>
  );
}
