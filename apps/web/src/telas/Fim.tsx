import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import type { EstadoSala, FimDePartida } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { Confete } from '../componentes/Confete';
import { Tela } from '../componentes/Tela';
import { Tic } from '../componentes/Tic';
import { acoes } from '../lib/jogo';
import { sons } from '../lib/sons';
import { vibracoes } from '../lib/vibrar';

type Pessoa = FimDePartida['classificacao'][number];

/** Degraus da esquerda para a direita: 2º, 1º, 3º, como num pódio de verdade. */
const DEGRAUS = [
  { lugar: 2, altura: 'h-32', cor: 'bg-[#dfe6f5]', avatar: 76 },
  { lugar: 1, altura: 'h-44', cor: 'bg-[#ffd23f]', avatar: 96 },
  { lugar: 3, altura: 'h-24', cor: 'bg-[#ffb07a]', avatar: 68 },
];

/** Ordem do suspense: do 3º para o 1º. */
const ORDEM_REVELACAO = [3, 2, 1];
const ESPERA_INICIAL_MS = 1800;
const ENTRE_LUGARES_MS = 1700;
/** O 1º lugar demora mais um pouco, para dar suspense. */
const ANTES_DO_PRIMEIRO_MS = 2300;

export function Fim({ sala }: { sala: EstadoSala }) {
  const reduzir = useReducedMotion();
  const fim = sala.fim!;
  const souDono = sala.jogadores.find((j) => j.id === sala.meuId)?.dono ?? false;
  const dono = sala.jogadores.find((j) => j.dono);
  const podio = fim.classificacao.slice(0, 3);
  const resto = fim.classificacao.slice(3);
  const eu = fim.classificacao.find((c) => c.jogadorId === sala.meuId);
  const lugares = ORDEM_REVELACAO.filter((lugar) => podio[lugar - 1]);

  const [revelados, setRevelados] = useState(reduzir ? lugares.length : 0);
  const acabou = revelados >= lugares.length;
  const primeiroRevelado = lugares.indexOf(1) < revelados;

  useEffect(() => {
    if (reduzir) {
      sons.podio();
      return;
    }
    sons.rufar();
    const timers: ReturnType<typeof setTimeout>[] = [];
    let quando = ESPERA_INICIAL_MS;
    lugares.forEach((lugar, i) => {
      timers.push(
        setTimeout(() => {
          setRevelados(i + 1);
          if (lugar === 1) {
            sons.podio();
            vibracoes.stop();
          } else {
            sons.revelar();
          }
        }, quando),
      );
      quando += lugares[i + 1] === 1 ? ANTES_DO_PRIMEIRO_MS : ENTRE_LUGARES_MS;
    });
    return () => timers.forEach(clearTimeout);
    // A revelação acontece uma vez, quando a tela abre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pular() {
    if (!primeiroRevelado) sons.podio();
    setRevelados(lugares.length);
  }

  const rodape = souDono ? (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button type="button" className="botao botao-amarelo flex-1 text-2xl" onClick={() => acoes.jogarDeNovo(false)}>
        Jogar de novo
      </button>
      <button type="button" className="botao flex-1" onClick={() => acoes.jogarDeNovo(true)}>
        Mudar as regras
      </button>
    </div>
  ) : (
    <p className="text-center font-bold text-texto-suave">
      Esperando {dono?.apelido ?? 'quem é dono da sala'} decidir se tem revanche…
    </p>
  );

  return (
    <Tela rodape={rodape}>
      {primeiroRevelado && <Confete quantidade={90} />}

      <div className="relative flex min-h-12 items-center justify-center">
        <AnimatePresence mode="wait">
          {acabou ? (
            <motion.h1
              key="fim"
              className="titulo text-center text-5xl"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
            >
              Fim de jogo!
            </motion.h1>
          ) : (
            <motion.h1
              key="suspense"
              className="titulo flex items-center gap-2 text-center text-3xl sm:text-4xl"
              exit={{ opacity: 0, y: -10 }}
            >
              <Tic tamanho={44} />E o pódio vai para…
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto mt-6 flex max-w-md items-end justify-center gap-2" role="list" aria-label="Pódio">
        {DEGRAUS.map((degrau, coluna) => {
          const pessoa = podio[degrau.lugar - 1];
          if (!pessoa) return <div key={degrau.lugar} className="flex-1" aria-hidden="true" />;
          const revelado = lugares.indexOf(degrau.lugar) < revelados;
          return (
            <div key={degrau.lugar} role="listitem" className="flex flex-1 flex-col items-center">
              <div className="relative flex min-h-[10.5rem] w-full flex-col items-center justify-end">
                <AnimatePresence>
                  {revelado && (
                    <PessoaNoPodio
                      pessoa={pessoa}
                      lugar={degrau.lugar}
                      tamanho={degrau.avatar}
                      eu={pessoa.jogadorId === sala.meuId}
                      reduzir={Boolean(reduzir)}
                    />
                  )}
                </AnimatePresence>
              </div>
              <motion.div
                className={`grid w-full place-items-start justify-center rounded-t-2xl border-[3px] border-b-0 border-[#0b1638] pt-2 ${degrau.altura} ${degrau.cor}`}
                initial={reduzir ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ originY: 1 }}
                transition={{ delay: 0.15 * coluna, type: 'spring', stiffness: 160, damping: 18 }}
              >
                <span className="font-titulo text-5xl text-[#0b1638]">
                  {pessoa.posicao}
                  <span className="sr-only">º lugar</span>
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="mx-auto h-[6px] max-w-md rounded-full bg-[#0b1638]" aria-hidden="true" />
      {!acabou && (
        <div className="mt-5 text-center">
          <button type="button" onClick={pular} className="chip px-4 py-2 hover:bg-white/20">
            Pular animação ⏭
          </button>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {lugares
          .slice(0, revelados)
          .map((lugar) => `${podio[lugar - 1]!.posicao}º lugar: ${podio[lugar - 1]!.apelido}.`)
          .join(' ')}
      </p>

      {acabou && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduzir ? 0 : 0.8 }}>
          {eu && (
            <p className="titulo mx-auto mt-6 text-center text-2xl">
              {eu.posicao === 1 ? 'Você ganhou! 🏆' : `Você ficou em ${eu.posicao}º lugar`}
            </p>
          )}

          {resto.length > 0 && (
            <ol className="mx-auto mt-5 flex max-w-md flex-col gap-2">
              {resto.map((j) => (
                <li
                  key={j.jogadorId}
                  className={`cartao flex items-center gap-3 px-2.5 py-2 ${j.jogadorId === sala.meuId ? 'ring-4 ring-amarelo' : ''}`}
                >
                  <span className="w-9 text-center font-titulo text-2xl">{j.posicao}º</span>
                  <Avatar id={j.avatar} tamanho={40} />
                  <span className="flex-1 truncate font-extrabold">{j.apelido}</span>
                  <span className="font-titulo text-2xl">{j.pontos}</span>
                </li>
              ))}
            </ol>
          )}

          <Resumo fim={fim} />

          <div className="mt-8 text-center">
            <button type="button" className="chip px-4 py-2 hover:bg-white/20" onClick={acoes.sair}>
              Sair da sala
            </button>
          </div>
        </motion.div>
      )}
    </Tela>
  );
}

/** O bicho cai do alto e quica no degrau. Quem ganhou leva coroa, raios e fica pulando. */
function PessoaNoPodio({
  pessoa,
  lugar,
  tamanho,
  eu,
  reduzir,
}: {
  pessoa: Pessoa;
  lugar: number;
  tamanho: number;
  eu: boolean;
  reduzir: boolean;
}) {
  const primeiro = lugar === 1;
  return (
    <motion.div
      className="relative flex w-full flex-col items-center"
      initial={reduzir ? false : { y: -320, opacity: 0, rotate: lugar === 2 ? -25 : 25 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 13 }}
    >
      {primeiro && !reduzir && (
        <motion.div
          className="absolute top-2 -z-10 size-44 rounded-full opacity-60"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, rgb(255 210 63 / 0.75) 0deg 10deg, transparent 10deg 24deg)',
            maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        />
      )}
      {primeiro && (
        <motion.span
          className="text-4xl"
          initial={reduzir ? false : { y: -40, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 12 }}
          aria-hidden="true"
        >
          👑
        </motion.span>
      )}
      <motion.div
        animate={primeiro && !reduzir ? { y: [0, -10, 0] } : undefined}
        transition={{ delay: 0.9, duration: 0.7, repeat: Infinity, repeatDelay: 0.5 }}
      >
        <Avatar
          id={pessoa.avatar}
          tamanho={tamanho}
          className={`shadow-[0_4px_0_#0b1638] ${eu ? 'ring-4 ring-amarelo' : ''}`}
        />
      </motion.div>
      <span className="mt-1 max-w-full truncate px-1 text-lg font-extrabold leading-normal">{pessoa.apelido}</span>
      <span className="chip mb-1 py-0">{pessoa.pontos} pts</span>
    </motion.div>
  );
}

function Resumo({ fim }: { fim: FimDePartida }) {
  const { resumo } = fim;
  return (
    <section className="mx-auto mt-8 grid max-w-md gap-3" aria-labelledby="titulo-resumo">
      <h2 id="titulo-resumo" className="titulo text-3xl">
        Resumo da partida
      </h2>
      <CartaoResumo titulo="Resposta mais votada">
        {resumo.maisVotada ? (
          <>
            <span className="font-titulo text-3xl text-coral">“{resumo.maisVotada.texto}”</span>
            <span className="block text-sm">
              de {resumo.maisVotada.apelido} em {resumo.maisVotada.categoria} · 👍 {resumo.maisVotada.votos}
            </span>
          </>
        ) : (
          'Ninguém votou 👍 desta vez.'
        )}
      </CartaoResumo>
      <CartaoResumo titulo="Quem mais apertou STOP">
        {resumo.maisStops
          ? `${resumo.maisStops.apelido} (${resumo.maisStops.quantidade}×)`
          : 'Ninguém. Todas as rodadas acabaram no tempo.'}
      </CartaoResumo>
      <CartaoResumo titulo="Categoria em que a sala mais errou">
        {resumo.categoriaMaisErrada
          ? `${resumo.categoriaMaisErrada.categoria} (${resumo.categoriaMaisErrada.anuladas} anuladas)`
          : 'Nenhuma! Sala de gênios.'}
      </CartaoResumo>
    </section>
  );
}

function CartaoResumo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="cartao p-3">
      <h3 className="rotulo">{titulo}</h3>
      <div className="mt-1 font-bold">{children}</div>
    </div>
  );
}
