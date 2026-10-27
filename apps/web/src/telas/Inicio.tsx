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
  criar: 'Criar uma sala',
  entrar: 'Entrar numa sala',
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

  return (
    <Tela>
      <div className="flex flex-col items-center pt-6 text-center sm:pt-12">
        <motion.div initial={{ rotate: -8, scale: 0.8, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }}>
          <h1>
            <Logo grande />
          </h1>
        </motion.div>
        <p className="mt-8 max-w-xs font-mao text-2xl leading-snug text-tinta-suave">
          O Stop do caderno, agora no celular. Uma letra, um cronômetro e quem gritar primeiro.
        </p>
      </div>

      {modo === 'inicio' ? (
        <div className="mx-auto mt-10 flex max-w-xs flex-col gap-4">
          <button type="button" className="adesivo adesivo-amarelo -rotate-1 text-xl" onClick={() => setModo('criar')}>
            Criar sala
          </button>
          <button type="button" className="adesivo rotate-1 text-xl" onClick={() => setModo('entrar')}>
            Entrar com código
          </button>
          <button type="button" className="adesivo adesivo-azul -rotate-1 flex-col gap-0 text-xl" onClick={() => setModo('jogarAgora')}>
            Jogar agora
            <span className="text-xs font-bold opacity-90">com quem estiver online</span>
          </button>
          <nav className="mt-2 flex justify-center gap-6 font-bold" aria-label="Mais">
            <button type="button" className="py-2 underline decoration-2 underline-offset-4" onClick={() => setModo('ranking')}>
              🏆 Ranking
            </button>
            <button type="button" className="py-2 underline decoration-2 underline-offset-4" onClick={() => setModo('historico')}>
              📒 Minhas partidas
            </button>
          </nav>
          <BotaoInstalar />
        </div>
      ) : (
        <Formulario modo={modo} codigoInicial={codigoInicial ?? ''} aoVoltar={() => setModo('inicio')} />
      )}
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

  return (
    <form onSubmit={enviar} className="cartao mx-auto mt-8 flex max-w-md flex-col gap-5 p-5" noValidate>
      <h2 className="font-mao text-3xl font-bold">{TITULOS[modo]}</h2>
      {modo === 'jogarAgora' && (
        <p className="-mt-3 text-sm text-tinta-suave">
          Você entra numa sala pública com outras pessoas. Se não tiver nenhuma aberta, uma nova é criada para você.
        </p>
      )}

      {modo === 'entrar' && (
        <label className="flex flex-col gap-1">
          <span className="rotulo">Código da sala</span>
          <input
            className="linha-escrita font-mono uppercase tracking-[0.4em]"
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

      <label className="flex flex-col gap-1">
        <span className="rotulo">Seu apelido</span>
        <input
          className="linha-escrita"
          value={apelido}
          onChange={(e) => setApelido(e.target.value)}
          maxLength={MAX_APELIDO}
          autoComplete="nickname"
          placeholder="Como te chamam?"
          autoFocus={modo !== 'entrar' || Boolean(codigoInicial)}
          required
        />
        <span className="text-right text-xs text-tinta-suave">
          {apelido.length}/{MAX_APELIDO}
        </span>
      </label>

      <fieldset>
        <legend className="rotulo mb-2">Escolha seu rabisco</legend>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Avatar">
          {AVATARES.map((a, i) => (
            <button
              key={a.nome}
              type="button"
              role="radio"
              aria-checked={avatar === i}
              aria-label={a.nome}
              onClick={() => setAvatar(i)}
              className={`grid aspect-square place-items-center rounded-xl border-2 transition ${
                avatar === i ? 'scale-105 border-caneta bg-marca-texto/40' : 'border-transparent'
              }`}
            >
              <Avatar id={i} tamanho={52} />
            </button>
          ))}
        </div>
      </fieldset>

      {erro && (
        <p role="alert" className="font-bold text-errado">
          {erro}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button type="submit" className="adesivo adesivo-amarelo text-xl" disabled={enviando}>
          {enviando ? 'Só um instante…' : BOTOES[modo]}
        </button>
        <button type="button" className="py-2 font-bold text-tinta-suave underline" onClick={aoVoltar}>
          Voltar
        </button>
      </div>
    </form>
  );
}
