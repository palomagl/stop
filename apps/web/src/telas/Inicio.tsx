import { motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { MAX_APELIDO, TAMANHO_CODIGO, apelidoSchema, codigoSchema } from '@rabisco/shared';
import { AVATARES, Avatar } from '../componentes/Avatar';
import { Logo } from '../componentes/Logo';
import { Tela } from '../componentes/Tela';
import { gravar, ler } from '../lib/armazenamento';
import { acoes, codigoDaUrl } from '../lib/jogo';
import { BotaoInstalar } from '../componentes/BotaoInstalar';
import { Historico } from './Historico';
import { Ranking } from './Ranking';

type Modo = 'inicio' | 'criar' | 'entrar' | 'jogarAgora' | 'ranking' | 'historico';
type ModoFormulario = 'criar' | 'entrar' | 'jogarAgora';

const TITULOS: Record<ModoFormulario, string> = {
  criar: 'Criar sala',
  entrar: 'Entrar na sala',
  jogarAgora: 'Jogar agora',
};

const BOTOES: Record<ModoFormulario, string> = {
  criar: 'Criar sala',
  entrar: 'Entrar',
  jogarAgora: 'Procurar sala',
};

interface Perfil {
  apelido: string;
  avatar: number;
}

export function Inicio() {
  const codigoInicial = codigoDaUrl();
  const [modo, setModo] = useState<Modo>(codigoInicial ? 'entrar' : 'inicio');

  if (modo === 'ranking') return <Ranking aoVoltar={() => setModo('inicio')} />;
  if (modo === 'historico') return <Historico aoVoltar={() => setModo('inicio')} />;

  if (modo !== 'inicio') {
    return <Formulario modo={modo} codigoInicial={codigoInicial ?? ''} aoVoltar={() => setModo('inicio')} />;
  }

  return (
    <Tela>
      <div className="flex flex-col items-center pt-4 text-center sm:pt-8">
        <motion.div
          initial={{ y: -30, scale: 0.85, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <h1>
            <Logo grande />
          </h1>
        </motion.div>
        <p className="mt-5 max-w-xs text-lg font-bold leading-snug text-texto-suave">
          Sorteia a letra, todo mundo escreve e quem terminar primeiro grita!
        </p>
      </div>

      <div className="mx-auto mt-7 flex max-w-sm flex-col gap-4">
        <button type="button" className="botao botao-amarelo w-full text-2xl" onClick={() => setModo('criar')}>
          Criar sala
        </button>
        <button type="button" className="botao w-full text-2xl" onClick={() => setModo('entrar')}>
          Entrar com código
        </button>
        <button type="button" className="botao botao-coral w-full text-2xl" onClick={() => setModo('jogarAgora')}>
          Jogar agora
          <small>com quem estiver online</small>
        </button>
        <nav className="mt-2 flex justify-center gap-3" aria-label="Mais">
          <button type="button" className="chip px-4 py-2 text-sm hover:bg-white/20" onClick={() => setModo('ranking')}>
            <span aria-hidden="true">🏆</span> Ranking
          </button>
          <button type="button" className="chip px-4 py-2 text-sm hover:bg-white/20" onClick={() => setModo('historico')}>
            <span aria-hidden="true">📒</span> Minhas partidas
          </button>
        </nav>
        <BotaoInstalar />
      </div>
    </Tela>
  );
}

function Formulario({ modo, codigoInicial, aoVoltar }: { modo: ModoFormulario; codigoInicial: string; aoVoltar: () => void }) {
  const salvo = ler<Perfil>('perfil');
  const [apelido, setApelido] = useState(salvo?.apelido ?? '');
  const [avatar, setAvatar] = useState(salvo?.avatar ?? Math.floor(Math.random() * AVATARES.length));
  const [codigo, setCodigo] = useState(codigoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const apelidoOk = apelidoSchema.safeParse(apelido);
    if (!apelidoOk.success) return setErro(apelidoOk.error.issues[0]!.message);
    let codigoOk = '';
    if (modo === 'entrar') {
      const r = codigoSchema.safeParse(codigo);
      if (!r.success) return setErro(r.error.issues[0]!.message);
      codigoOk = r.data;
    }
    setErro(null);
    setEnviando(true);
    gravar('perfil', { apelido: apelidoOk.data, avatar } satisfies Perfil);
    const falha =
      modo === 'criar'
        ? await acoes.criarSala(apelidoOk.data, avatar)
        : modo === 'jogarAgora'
          ? await acoes.jogarAgora(apelidoOk.data, avatar)
          : await acoes.entrarSala(codigoOk, apelidoOk.data, avatar);
    setEnviando(false);
    if (falha) setErro(falha);
  }

  const escolhido = AVATARES[avatar] ?? AVATARES[0]!;

  return (
    <Tela
      rodape={
        <div className="flex flex-col gap-1.5">
          {erro && (
            <p role="alert" className="text-center font-bold text-amarelo">
              {erro}
            </p>
          )}
          <button type="submit" form="form-entrada" className="botao botao-amarelo w-full text-2xl" disabled={enviando}>
            {enviando ? 'Só um instante…' : BOTOES[modo]}
          </button>
        </div>
      }
    >
      <form id="form-entrada" onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="flex items-center justify-between">
          <button type="button" className="chip py-1.5 hover:bg-white/20" onClick={aoVoltar}>
            ← Voltar
          </button>
        </div>
        <div>
          <h2 className="titulo text-4xl">{TITULOS[modo]}</h2>
          {modo === 'jogarAgora' && (
            <p className="mt-2 font-semibold text-texto-suave">
              Você entra numa sala pública com outras pessoas. Se não tiver nenhuma aberta, uma nova é criada para você.
            </p>
          )}
        </div>

        {modo === 'entrar' && (
          <label className="cartao flex flex-col gap-1 px-4 py-3">
            <span className="rotulo">Código da sala</span>
            <input
              className="campo font-titulo text-3xl uppercase tracking-[0.35em]"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              maxLength={TAMANHO_CODIGO}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              placeholder="GATOS"
              autoFocus={!codigoInicial}
              required
            />
          </label>
        )}

        <label className="cartao flex flex-col gap-1 px-4 py-3">
          <span className="flex justify-between">
            <span className="rotulo">Seu apelido</span>
            <span className="text-xs font-bold text-tinta-suave" aria-hidden="true">
              {apelido.length}/{MAX_APELIDO}
            </span>
          </span>
          <input
            className="campo"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            maxLength={MAX_APELIDO}
            autoComplete="nickname"
            placeholder="Como te chamam?"
            autoFocus={modo !== 'entrar' || Boolean(codigoInicial)}
            required
          />
        </label>

        <fieldset>
          <legend className="titulo mb-1 text-2xl">Escolha seu bicho</legend>
          <p className="mb-3 text-sm font-bold text-texto-suave" aria-live="polite">
            {escolhido.nome}
          </p>
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6" role="radiogroup" aria-label="Avatar">
            {AVATARES.map((a, i) => (
              <button
                key={a.nome}
                type="button"
                role="radio"
                aria-checked={avatar === i}
                aria-label={a.nome}
                onClick={() => setAvatar(i)}
                className={`rounded-[22%] transition ${
                  avatar === i
                    ? 'scale-105 shadow-[0_0_0_3px_#0b1638,0_0_0_7px_var(--amarelo),0_0_22px_var(--amarelo)]'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                <Avatar id={i} tamanho={120} className="h-auto w-full" />
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Tela>
  );
}
