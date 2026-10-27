import { motion } from 'framer-motion';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { MAX_APELIDO, TAMANHO_CODIGO, apelidoSchema, codigoSchema } from '@rabisco/shared';
import { AVATARES, Avatar } from '../componentes/Avatar';
import { Icone } from '../componentes/Icone';
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
    <Tela larga>
      <div className="inicio">
        <section className="inicio-hero" aria-label="Stopou! Adedonha online">
          <span className="inicio-etiqueta"><span aria-hidden="true">✦</span> A adedonha da galera</span>
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <h1 className="mt-5"><Logo grande /></h1>
          </motion.div>
          <p className="mx-auto mt-6 max-w-xs text-lg font-semibold leading-snug text-texto-suave">
            Uma letra. Mil ideias.<br />Quem terminar primeiro grita STOP!
          </p>
          <div className="inicio-turma" aria-hidden="true">
            {[15, 0, 2, 23, 22].map((id, i) => (
              <span key={id} style={{ rotate: `${(i - 2) * 7}deg`, translate: `0 ${Math.abs(i - 2) * 5}px` }}>
                <Avatar id={id} tamanho={58} />
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs font-bold tracking-wide text-texto-suave">De 2 a 10 pessoas · Sem cadastro · Só diversão</p>
        </section>

        <section className="inicio-menu" aria-label="Vamos jogar">
          <div className="mb-5">
            <p className="inicio-sobretitulo">JUNTA A TURMA</p>
            <h2 className="titulo mt-1 text-4xl">Bora jogar?</h2>
          </div>
          <div className="flex flex-col gap-4">
            <button type="button" aria-label="Criar sala" className="botao botao-amarelo inicio-acao" onClick={() => setModo('criar')}>
              <span className="inicio-acao-icone" aria-hidden="true">＋</span>
              <span className="flex-1 text-left">Criar sala<small>Chame a galera e escolha as regras</small></span>
              <span className="inicio-seta"><Icone nome="seta" /></span>
            </button>
            <button type="button" aria-label="Entrar com código" className="botao inicio-acao" onClick={() => setModo('entrar')}>
              <span className="inicio-acao-icone" aria-hidden="true">#</span>
              <span className="flex-1 text-left">Entrar com código<small>Já tem uma sala te esperando?</small></span>
              <span className="inicio-seta"><Icone nome="seta" /></span>
            </button>
            <div className="inicio-divisor"><span>ou conheça uma nova turma</span></div>
            <button type="button" aria-label="Jogar agora" className="botao botao-coral inicio-acao" onClick={() => setModo('jogarAgora')}>
              <span className="inicio-acao-icone"><Icone nome="raio" /></span>
              <span className="flex-1 text-left">Jogar agora<small>Encontre uma sala pública</small></span>
              <span className="inicio-seta"><Icone nome="seta" /></span>
            </button>
          </div>
          <nav className="inicio-links" aria-label="Mais">
            <button type="button" className="chip" onClick={() => setModo('ranking')}>
              <span aria-hidden="true">🏆</span> Ranking
            </button>
            <button type="button" className="chip" onClick={() => setModo('historico')}>
              <span aria-hidden="true">↺</span> Minhas partidas
            </button>
          </nav>
          <BotaoInstalar />
        </section>
      </div>
      <ol className="inicio-passos" aria-label="Como jogar">
        {[
          ['01', 'Sorteia a letra', 'A mesma para todo mundo.'],
          ['02', 'Solta as ideias', 'Uma resposta por categoria.'],
          ['03', 'Grita STOP!', 'Depois, a turma confere e pontua.'],
        ].map(([numero, titulo, descricao]) => (
          <li key={numero}>
            <span className="inicio-passo-numero" aria-hidden="true">{numero}</span>
            <span><strong>{titulo}</strong><small>{descricao}</small></span>
          </li>
        ))}
      </ol>
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

  function navegarAvatares(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const grade = evento.currentTarget.parentElement;
    if (!grade) return;
    const colunas = getComputedStyle(grade).gridTemplateColumns.split(' ').length;
    const passos: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: colunas, ArrowUp: -colunas };
    let proximo: number;
    if (evento.key === 'Home') proximo = 0;
    else if (evento.key === 'End') proximo = AVATARES.length - 1;
    else if (evento.key in passos) proximo = (indice + passos[evento.key]! + AVATARES.length) % AVATARES.length;
    else return;
    evento.preventDefault();
    setAvatar(proximo);
    grade.querySelectorAll<HTMLButtonElement>('button')[proximo]?.focus();
  }

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
      <form id="form-entrada" onSubmit={enviar} className="flex flex-col gap-6" noValidate>
        <div className="flex items-center justify-between">
          <button type="button" className="chip py-1.5 hover:bg-white/20" onClick={aoVoltar}>
            ← Voltar
          </button>
        </div>
        <div>
          <p className="inicio-sobretitulo mb-2">SEU LUGAR NA BRINCADEIRA</p>
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
          <div className="perfil-escolhido mb-5">
            <Avatar id={avatar} tamanho={44} />
            <span><span className="block text-xs font-semibold text-texto-suave">Esse é você na partida</span>
              <strong className="block text-lg leading-tight" aria-live="polite">{escolhido.nome}</strong>
            </span>
            <span className="ml-auto text-amarelo" aria-hidden="true">✦</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6" role="radiogroup" aria-label="Avatar">
            {AVATARES.map((a, i) => (
              <button
                key={a.nome}
                type="button"
                role="radio"
                aria-checked={avatar === i}
                aria-label={a.nome}
                title={a.nome}
                tabIndex={avatar === i ? 0 : -1}
                onKeyDown={(e) => navegarAvatares(e, i)}
                onClick={() => setAvatar(i)}
                className="avatar-opcao"
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
