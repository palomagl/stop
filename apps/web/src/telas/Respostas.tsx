import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { DICAS_CATEGORIA, MAX_RESPOSTA, limparTexto, type EstadoSala } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { Cronometro } from '../componentes/Cronometro';
import { Tela } from '../componentes/Tela';
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
        className="adesivo adesivo-stop h-16 flex-1 text-3xl tracking-wider"
      >
        STOP!
      </button>
      <p className="w-24 text-sm font-bold leading-tight text-tinta-suave" aria-live="polite">
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
      <div className="sticky top-14 z-20 border-b-2 border-tinta/15 bg-papel/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 py-2 pl-9 pr-4 sm:pl-20 sm:pr-8">
          <div className="flex items-center gap-3">
            <span
              className="grid size-14 -rotate-6 place-items-center rounded-full border-[3px] border-tinta bg-marca-texto font-mao text-5xl font-bold leading-none text-[#1f2a44]"
              aria-label={`Letra ${letra}`}
            >
              {letra}
            </span>
            <span className="text-sm font-bold text-tinta-suave">
              Rodada {sala.rodada}/{sala.config.rodadas}
            </span>
          </div>
          {!travando && <Cronometro terminaEm={sala.terminaEm} grande />}
        </div>
        <AnimatePresence>{travando && <AvisoStop sala={sala} restante={restante} />}</AnimatePresence>
      </div>

      <Tela rodape={rodape}>
        {outros.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-3" aria-label="Progresso dos outros jogadores">
            {outros.map((j) => (
              <li key={j.id} className="flex items-center gap-1 text-sm font-bold text-tinta-suave">
                <Avatar id={j.avatar} tamanho={26} className={j.online ? '' : 'opacity-40'} />
                <span className="sr-only">{j.apelido}:</span>
                {j.preenchidas}/{categorias.length}
              </li>
            ))}
          </ul>
        )}

        <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()} autoComplete="off">
          {categorias.map((categoria, i) => {
            const id = `resposta-${i}`;
            return (
              <div key={categoria} className="flex flex-col">
                <label htmlFor={id} className="rotulo flex items-baseline justify-between gap-2">
                  <span>
                    {categoria}
                    {Object.hasOwn(DICAS_CATEGORIA, categoria) && (
                      <span className="font-semibold text-tinta-suave"> · {DICAS_CATEGORIA[categoria]}</span>
                    )}
                  </span>
                </label>
                <input
                  id={id}
                  ref={(el) => {
                    campos.current[i] = el;
                  }}
                  className="linha-escrita"
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
      className="overflow-hidden bg-stop text-stop-texto"
      role="alert"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 py-2 pl-9 pr-4 sm:pl-20 sm:pr-8">
        <p className="font-black leading-tight">
          <span className="block text-2xl tracking-wide">STOP!</span>
          <span className="text-sm font-bold">
            {quem?.id === sala.meuId ? 'Você parou a rodada.' : `${quem?.apelido ?? 'Alguém'} parou. Termine a palavra!`}
          </span>
        </p>
        <motion.span
          key={numero}
          initial={{ scale: 1.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-mao text-6xl font-bold leading-none"
          aria-hidden="true"
        >
          {numero}
        </motion.span>
      </div>
    </motion.div>
  );
}
