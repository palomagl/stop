import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { DICAS_CATEGORIA, MAX_RESPOSTA, limparTexto, type EstadoSala } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { Cronometro } from '../componentes/Cronometro';
import { Tela } from '../componentes/Tela';
import { Tic } from '../componentes/Tic';
import { acoes } from '../lib/jogo';
import { useTempoRestante } from '../lib/relogio';
import { sons } from '../lib/sons';

/** Espera um pouco depois da última tecla antes de mandar o rascunho. */
const ESPERA_RASCUNHO_MS = 250;

export function Respostas({ sala }: { sala: EstadoSala }) {
  const categorias = sala.config.categorias;
  const letra = sala.letra!;
  const [respostas, setRespostas] = useState<Record<string, string>>(() => ({ ...sala.minhasRespostas }));
  const respostasRef = useRef(respostas);
  const pendentes = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const campos = useRef<(HTMLInputElement | null)[]>([]);
  const botaoStop = useRef<HTMLButtonElement>(null);

  const restante = useTempoRestante(sala.terminaEm);
  const travando = sala.fase === 'travando';
  const fechado = restante <= 0;
  const eu = sala.jogadores.find((j) => j.id === sala.meuId);
  const participando = eu?.participando ?? false;
  const faltando = categorias.filter((c) => !limparTexto(respostas[c] ?? '')).length;
  const podeParar = participando && !travando && !fechado && faltando === 0;

  function enviar(categoria: string) {
    const timer = pendentes.current.get(categoria);
    if (timer) clearTimeout(timer);
    pendentes.current.delete(categoria);
    acoes.rascunho(categoria, respostasRef.current[categoria] ?? '');
  }

  function enviarPendentes() {
    for (const categoria of [...pendentes.current.keys()]) enviar(categoria);
  }

  function mudar(categoria: string, texto: string) {
    respostasRef.current = { ...respostasRef.current, [categoria]: texto };
    setRespostas(respostasRef.current);
    const timer = pendentes.current.get(categoria);
    if (timer) clearTimeout(timer);
    pendentes.current.set(
      categoria,
      setTimeout(() => enviar(categoria), ESPERA_RASCUNHO_MS),
    );
  }

  // Quando o tempo acaba, manda tudo o que ainda não foi.
  useEffect(() => {
    if (fechado) enviarPendentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechado]);

  // Saindo da tela (fim da rodada), nada fica para trás.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => enviarPendentes(), []);

  function parar() {
    for (const timer of pendentes.current.values()) clearTimeout(timer);
    pendentes.current.clear();
    acoes.stop(respostasRef.current);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>, indice: number) {
    if (evento.key !== 'Enter') return;
    evento.preventDefault();
    const proximo = campos.current[indice + 1];
    if (proximo) proximo.focus();
    else botaoStop.current?.focus();
  }

  const outros = sala.jogadores.filter((j) => j.id !== sala.meuId && j.participando);

  const rodape = (
    <div className="flex items-center gap-3">
      <button
        ref={botaoStop}
        type="button"
        onClick={parar}
        disabled={!podeParar}
        className="botao botao-coral h-[4.25rem] flex-1 text-4xl tracking-wider"
      >
        STOP!
      </button>
      <p className="w-24 text-sm font-extrabold leading-tight text-texto-suave" aria-live="polite">
        {!participando
          ? 'Você entra na próxima rodada.'
          : fechado || travando
            ? 'Rodada travada.'
            : faltando > 0
              ? `Falta${faltando > 1 ? 'm' : ''} ${faltando}`
              : 'Tudo pronto!'}
      </p>
    </div>
  );

  return (
    <>
      <div className="sticky top-14 z-20 border-b-2 border-white/10 bg-[var(--vidro)] backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <span
            className="grid size-16 shrink-0 place-items-center rounded-full border-[3px] border-[#0b1638] bg-amarelo font-titulo text-5xl leading-none text-[#0b1638] shadow-[0_4px_0_#0b1638]"
            aria-label={`Letra ${letra}`}
          >
            {letra}
          </span>
          <div className="flex flex-col items-end">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-texto-suave">
              Rodada {sala.rodada} de {sala.config.rodadas}
            </span>
            {!travando && <Cronometro terminaEm={sala.terminaEm} grande />}
          </div>
        </div>
        <AnimatePresence>{travando && <AvisoStop sala={sala} restante={restante} />}</AnimatePresence>
      </div>

      <Tela rodape={rodape}>
        {outros.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2" aria-label="Progresso dos outros jogadores">
            {outros.map((j) => (
              <li key={j.id} className="chip py-0.5 pl-0.5">
                <Avatar id={j.avatar} tamanho={26} className={`rounded-full ${j.online ? '' : 'opacity-40'}`} />
                <span className="max-w-24 truncate">{j.apelido}</span>
                {j.preenchidas}/{categorias.length}
              </li>
            ))}
          </ul>
        )}

        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()} autoComplete="off">
          {categorias.map((categoria, i) => {
            const id = `resposta-${i}`;
            return (
              <div key={categoria} className="cartao flex flex-col px-4 pt-2 pb-2.5">
                <label htmlFor={id} className="rotulo">
                  {categoria}
                  {Object.hasOwn(DICAS_CATEGORIA, categoria) && (
                    <span className="normal-case tracking-normal"> · {DICAS_CATEGORIA[categoria]}</span>
                  )}
                </label>
                <input
                  id={id}
                  ref={(el) => {
                    campos.current[i] = el;
                  }}
                  className="campo"
                  value={respostas[categoria] ?? ''}
                  onChange={(e) => mudar(categoria, e.target.value)}
                  onBlur={() => pendentes.current.has(categoria) && enviar(categoria)}
                  onKeyDown={(e) => aoTeclar(e, i)}
                  onFocus={(e) => e.currentTarget.scrollIntoView({ block: 'center' })}
                  maxLength={MAX_RESPOSTA}
                  placeholder={`${letra}…`}
                  disabled={!participando || fechado}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  enterKeyHint={i === categorias.length - 1 ? 'done' : 'next'}
                  autoFocus={i === 0}
                />
              </div>
            );
          })}
        </form>
      </Tela>
    </>
  );
}

function AvisoStop({ sala, restante }: { sala: EstadoSala; restante: number }) {
  const quem = sala.jogadores.find((j) => j.id === sala.stopPor);
  const numero = Math.max(1, Math.ceil(restante / 1000));

  useEffect(() => {
    if (restante > 0) sons.contagem();
    // Toca uma vez por número da contagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden border-t-[3px] border-[#0b1638] bg-coral text-white"
      role="alert"
    >
      <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-2 sm:px-6">
        <Tic tamanho={52} />
        <p className="flex-1 leading-tight">
          <span className="titulo block text-3xl">STOP!</span>
          <span className="text-sm font-extrabold">
            {quem?.id === sala.meuId ? 'Você parou a rodada.' : `${quem?.apelido ?? 'Alguém'} parou. Termine a palavra!`}
          </span>
        </p>
        <motion.span
          key={numero}
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="titulo text-6xl"
          aria-hidden="true"
        >
          {numero}
        </motion.span>
      </div>
    </motion.div>
  );
}
