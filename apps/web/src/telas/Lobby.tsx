import { useEffect, useState, type FormEvent } from 'react';
import {
  ALFABETO,
  CATEGORIAS_PADRAO,
  DICAS_CATEGORIA,
  MAX_CATEGORIA,
  MAX_RODADAS,
  MIN_JOGADORES,
  MIN_RODADAS,
  configSchema,
  normalizar,
  type Config,
  type EstadoSala,
  type JogadorPublico,
} from '@rabisco/shared';
import { ListaJogadores } from '../componentes/ListaJogadores';
import { Tela } from '../componentes/Tela';
import { acoes, avisar, linkDaSala } from '../lib/jogo';
import { MAX_LISTAS, apagarLista, lembrarConfig, salvarLista, useListas } from '../lib/listas';

const TEMPOS = [30, 45, 60, 90, 120, 180];

export function Lobby({ sala }: { sala: EstadoSala }) {
  const eu = sala.jogadores.find((j) => j.id === sala.meuId)!;
  const souDono = eu.dono;
  const online = sala.jogadores.filter((j) => j.online);
  const faltamProntos = online.filter((j) => !j.dono && !j.pronto);
  const podeComecar = online.length >= MIN_JOGADORES && faltamProntos.length === 0;

  function remover(jogador: JogadorPublico) {
    if (window.confirm(`Remover ${jogador.apelido} da sala?`)) acoes.remover(jogador.id);
  }

  const rodape = souDono ? (
    <div className="flex flex-col gap-1">
      <button type="button" className="botao botao-amarelo w-full text-2xl" disabled={!podeComecar} onClick={acoes.iniciar}>
        Começar partida
      </button>
      <p className="text-center text-sm font-bold text-texto-suave" aria-live="polite">
        {online.length < MIN_JOGADORES
          ? 'Mande o código para mais alguém entrar.'
          : faltamProntos.length > 0
            ? `Esperando ${faltamProntos.map((j) => j.apelido).join(', ')} ficar pronto.`
            : 'Todo mundo pronto!'}
      </p>
    </div>
  ) : (
    <button
      type="button"
      className={`botao w-full text-2xl ${eu.pronto ? 'botao-menta' : 'botao-amarelo'}`}
      aria-pressed={eu.pronto}
      onClick={() => acoes.pronto(!eu.pronto)}
    >
      {eu.pronto ? '✓ Pronto! (tocar para desfazer)' : 'Estou pronto!'}
    </button>
  );

  return (
    <Tela rodape={rodape}>
      <Convite codigo={sala.codigo} />

      <section className="mt-8" aria-labelledby="titulo-jogadores">
        <h2 id="titulo-jogadores" className="titulo mb-3 text-3xl">
          Quem está na sala ({sala.jogadores.length}/10)
        </h2>
        <ListaJogadores jogadores={sala.jogadores} meuId={sala.meuId} aoRemover={souDono ? remover : undefined} />
      </section>

      <section className="mt-8" aria-labelledby="titulo-config">
        <h2 id="titulo-config" className="titulo mb-3 text-3xl">
          Regras da partida
        </h2>
        {souDono ? <EditorConfig config={sala.config} /> : <ResumoConfig config={sala.config} />}
      </section>

      <div className="mt-8 text-center">
        <button type="button" className="chip px-4 py-2 hover:bg-white/20" onClick={acoes.sair}>
          Sair da sala
        </button>
      </div>
    </Tela>
  );
}

function Convite({ codigo }: { codigo: string }) {
  const link = linkDaSala(codigo);
  const [qr, setQr] = useState<string | null>(null);
  const [mostrarQr, setMostrarQr] = useState(false);

  useEffect(() => {
    if (!mostrarQr) return;
    // A biblioteca de QR só é baixada quando alguém abre o QR code.
    import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toString(link, { type: 'svg', margin: 1, color: { dark: '#0b1638', light: '#ffffff' } }),
      )
      .then(setQr)
      .catch(() => setQr(null));
  }, [link, mostrarQr]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      avisar('Link copiado!');
    } catch {
      avisar(`Não deu para copiar. O link é ${link}`);
    }
  }

  async function compartilhar() {
    try {
      await navigator.share({ title: 'Bora jogar Stop?', text: `Entra na minha sala: ${codigo}`, url: link });
    } catch {
      // a pessoa fechou o menu de compartilhar
    }
  }

  return (
    <section className="cartao relative p-5 text-center" aria-labelledby="titulo-codigo">
      <h2 id="titulo-codigo" className="rotulo">
        Código da sala
      </h2>
      <p className="my-1 font-titulo text-6xl tracking-[0.2em] text-tinta sm:text-7xl" aria-label={codigo.split('').join(' ')}>
        {codigo}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" className="botao botao-pequeno" onClick={copiar}>
          Copiar link
        </button>
        {'share' in navigator && (
          <button type="button" className="botao botao-pequeno botao-amarelo" onClick={compartilhar}>
            Compartilhar
          </button>
        )}
        <button type="button" className="botao botao-pequeno" aria-expanded={mostrarQr} onClick={() => setMostrarQr((m) => !m)}>
          QR code
        </button>
      </div>
      {mostrarQr && qr && (
        <div
          className="mx-auto mt-4 w-48 rounded-xl border-[3px] border-[#0b1638] bg-white p-2"
          role="img"
          aria-label={`QR code para entrar na sala ${codigo}`}
          // SVG gerado pela biblioteca a partir do nosso próprio link.
          dangerouslySetInnerHTML={{ __html: qr }}
        />
      )}
    </section>
  );
}

function ResumoConfig({ config }: { config: Config }) {
  return (
    <div className="cartao space-y-3 p-4">
      <p>
        <strong>{config.rodadas}</strong> {config.rodadas === 1 ? 'rodada' : 'rodadas'} de até{' '}
        <strong>{config.tempoRodadaSeg} segundos</strong>.
      </p>
      <p>
        <strong>Fora do sorteio:</strong> {config.letrasExcluidas.length ? config.letrasExcluidas.join(', ') : 'nenhuma letra'}
      </p>
      <div>
        <strong>Categorias ({config.categorias.length}):</strong>
        <ul className="mt-2 flex flex-wrap gap-2">
          {config.categorias.map((c) => (
            <li key={c} className="rounded-full bg-cartao-2 px-3 py-1 font-bold">
              {c}
            </li>
          ))}
        </ul>
      </div>
      {config.publica && (
        <p>
          <strong>Sala pública:</strong> quem tocar em "Jogar agora" pode cair aqui.
        </p>
      )}
      <p className="text-sm text-tinta-suave">Só quem é dono da sala muda as regras.</p>
    </div>
  );
}

function EditorConfig({ config }: { config: Config }) {
  const [novaCategoria, setNovaCategoria] = useState('');
  const [nomeLista, setNomeLista] = useState('');
  const listas = useListas();
  const todasCategorias = [...CATEGORIAS_PADRAO, ...config.categorias.filter((c) => !CATEGORIAS_PADRAO.includes(c))];

  /** Confere localmente com o mesmo schema do servidor antes de mandar. */
  function salvar(nova: Config) {
    const r = configSchema.safeParse(nova);
    if (!r.success) return avisar(r.error.issues[0]!.message);
    acoes.configurar(r.data);
    lembrarConfig(r.data);
  }

  function usarLista(categorias: string[]) {
    salvar({ ...config, categorias });
  }

  function guardarLista(e: FormEvent) {
    e.preventDefault();
    const nome = nomeLista.replace(/\s+/g, ' ').trim();
    if (!nome) return;
    salvarLista(nome, config.categorias);
    setNomeLista('');
    avisar(`Lista "${nome}" salva neste aparelho.`);
  }

  function alternarCategoria(categoria: string) {
    const marcada = config.categorias.includes(categoria);
    // Mantém a ordem da lista na tela.
    const categorias = marcada
      ? config.categorias.filter((c) => c !== categoria)
      : todasCategorias.filter((c) => c === categoria || config.categorias.includes(c));
    salvar({ ...config, categorias });
  }

  function adicionarCategoria(e: FormEvent) {
    e.preventDefault();
    const nome = novaCategoria.replace(/\s+/g, ' ').trim();
    if (!nome) return;
    if (config.categorias.some((c) => normalizar(c) === normalizar(nome))) return avisar('Essa categoria já está na lista.');
    salvar({ ...config, categorias: [...config.categorias, nome] });
    setNovaCategoria('');
  }

  function alternarLetra(letra: string) {
    const letrasExcluidas = config.letrasExcluidas.includes(letra)
      ? config.letrasExcluidas.filter((l) => l !== letra)
      : [...config.letrasExcluidas, letra];
    salvar({ ...config, letrasExcluidas });
  }

  return (
    <div className="cartao space-y-6 p-4">
      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="rotulo block">Sala pública</span>
          <span className="text-sm text-tinta-suave">Quem tocar em "Jogar agora" pode entrar aqui.</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="size-7 shrink-0 accent-[var(--coral)]"
          checked={config.publica}
          onChange={(e) => salvar({ ...config, publica: e.target.checked })}
        />
      </label>

      {listas.length > 0 && (
        <div>
          <h3 className="rotulo mb-2">Minhas listas</h3>
          <ul className="flex flex-wrap gap-2">
            {listas.map((l) => (
              <li key={l.nome} className="flex items-center rounded-full border-2 border-tinta-suave/40 bg-cartao-2">
                <button
                  type="button"
                  className="py-1.5 pl-3 pr-2 text-left font-bold"
                  onClick={() => usarLista(l.categorias)}
                  title={l.categorias.join(', ')}
                >
                  {l.nome} <span className="text-sm font-semibold text-tinta-suave">({l.categorias.length})</span>
                </button>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full text-tinta-suave"
                  aria-label={`Apagar a lista ${l.nome}`}
                  onClick={() => window.confirm(`Apagar a lista "${l.nome}"?`) && apagarLista(l.nome)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset>
        <legend className="rotulo mb-2">Categorias (toque para marcar ou desmarcar)</legend>
        <div className="flex flex-wrap gap-2">
          {todasCategorias.map((c) => {
            const marcada = config.categorias.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={marcada}
                onClick={() => alternarCategoria(c)}
                className={`rounded-full border-2 px-3 py-1.5 text-left font-extrabold leading-tight transition active:scale-95 ${
                  marcada
                    ? 'border-[#0b1638] bg-amarelo text-[#0b1638] shadow-[0_3px_0_#0b1638]'
                    : 'border-dashed border-tinta-suave/50 text-tinta-suave line-through'
                }`}
              >
                <span aria-hidden="true">{marcada ? '✓ ' : ''}</span>
                {c}
                {Object.hasOwn(DICAS_CATEGORIA, c) && (
                  <span className="block text-xs font-semibold no-underline opacity-80">{DICAS_CATEGORIA[c]}</span>
                )}
              </button>
            );
          })}
        </div>
        <form onSubmit={adicionarCategoria} className="mt-3 flex items-end gap-2">
          <label className="flex flex-1 flex-col">
            <span className="text-sm font-bold">Nova categoria</span>
            <input
              className="campo text-xl"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              maxLength={MAX_CATEGORIA}
              placeholder="Ex.: Time de futebol"
            />
          </label>
          <button type="submit" className="botao botao-pequeno" disabled={!novaCategoria.trim()}>
            Adicionar
          </button>
        </form>
        <form onSubmit={guardarLista} className="mt-3 flex items-end gap-2">
          <label className="flex flex-1 flex-col">
            <span className="text-sm font-bold">Salvar estas categorias como lista</span>
            <input
              className="campo text-xl"
              value={nomeLista}
              onChange={(e) => setNomeLista(e.target.value)}
              maxLength={24}
              placeholder="Ex.: Nossa lista"
            />
          </label>
          <button
            type="submit"
            className="botao botao-pequeno"
            disabled={!nomeLista.trim() || (listas.length >= MAX_LISTAS && !listas.some((l) => l.nome === nomeLista.trim()))}
          >
            Salvar
          </button>
        </form>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="rotulo mb-2">Rodadas</legend>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="botao botao-pequeno size-12 p-0 text-2xl"
              aria-label="Menos uma rodada"
              disabled={config.rodadas <= MIN_RODADAS}
              onClick={() => salvar({ ...config, rodadas: config.rodadas - 1 })}
            >
              −
            </button>
            <output className="w-10 text-center font-titulo text-4xl tabular-nums" aria-live="polite">
              {config.rodadas}
            </output>
            <button
              type="button"
              className="botao botao-pequeno size-12 p-0 text-2xl"
              aria-label="Mais uma rodada"
              disabled={config.rodadas >= MAX_RODADAS}
              onClick={() => salvar({ ...config, rodadas: config.rodadas + 1 })}
            >
              +
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend className="rotulo mb-2">Tempo máximo da rodada</legend>
          <div className="flex flex-wrap gap-2">
            {TEMPOS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={config.tempoRodadaSeg === t}
                onClick={() => salvar({ ...config, tempoRodadaSeg: t })}
                className={`min-w-14 rounded-xl border-2 px-2 py-2 font-extrabold transition active:scale-95 ${
                  config.tempoRodadaSeg === t
                    ? 'border-[#0b1638] bg-amarelo text-[#0b1638] shadow-[0_3px_0_#0b1638]'
                    : 'border-tinta-suave/40'
                }`}
              >
                {t < 60 ? `${t}s` : `${Math.floor(t / 60)}${t % 60 ? `:${String(t % 60).padStart(2, '0')}` : ''} min`}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset>
        <legend className="rotulo mb-1">Letras fora do sorteio</legend>
        <p className="mb-2 text-sm font-semibold text-tinta-suave">Letras riscadas não são sorteadas.</p>
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-13">
          {ALFABETO.map((l) => {
            const fora = config.letrasExcluidas.includes(l);
            return (
              <button
                key={l}
                type="button"
                aria-pressed={fora}
                aria-label={`${l}: ${fora ? 'fora do sorteio' : 'no sorteio'}`}
                onClick={() => alternarLetra(l)}
                className={`relative grid aspect-square place-items-center rounded-xl border-2 font-titulo text-xl transition active:scale-95 ${
                  fora ? 'border-errado bg-errado/10 text-errado' : 'border-tinta-suave/40'
                }`}
              >
                {l}
                {fora && (
                  <svg className="absolute inset-1" viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M1 9L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
