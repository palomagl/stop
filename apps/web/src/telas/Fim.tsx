import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import type { EstadoSala, FimDePartida } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { Bonequinho, Degrau, PlacaNome } from '../componentes/Podio';
import { Confete } from '../componentes/Confete';
import { Tela } from '../componentes/Tela';
import { Tic } from '../componentes/Tic';
import { acoes } from '../lib/jogo';
import { sons } from '../lib/sons';
import { vibracoes } from '../lib/vibrar';

type Pessoa = FimDePartida['classificacao'][number];

/** Colunas da esquerda para a direita: 2º, 1º, 3º, como num pódio de verdade. */
const COLUNAS = [
  { lugar: 2 as const, largura: 100 },
  { lugar: 1 as const, largura: 120 },
  { lugar: 3 as const, largura: 100 },
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
              className="rounded-2xl border-[3px] border-[#0b1638] bg-[#6f93ff] px-5 py-1 font-titulo text-4xl text-[#0b1638] shadow-[0_4px_0_#0b1638]"
              initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            >
              Pódio!
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

      <div className="relative mx-auto mt-4 max-w-md">
        {/* Faixa amarela atrás dos bonequinhos, como num palco */}
        <div
          className="pointer-events-none absolute -inset-x-6 top-[34%] h-28 -rotate-[8deg] bg-amarelo/90"
          aria-hidden="true"
        />
        <div className="relative flex items-end justify-center" role="list" aria-label="Pódio">
          {COLUNAS.map((coluna, i) => {
            const pessoa = podio[coluna.lugar - 1];
            if (!pessoa) return <div key={coluna.lugar} className="flex-1" aria-hidden="true" />;
            const revelado = lugares.indexOf(coluna.lugar) < revelados;
            return (
              <div key={coluna.lugar} role="listitem" className="flex min-w-0 flex-1 flex-col items-center">
                {/* Na frente do degrau, com o pescocinho apoiado na tampa */}
                <div className="relative z-[3] -mb-3 flex h-[12.5rem] w-full flex-col items-center justify-end">
                  <AnimatePresence>
                    {revelado && (
                      <PessoaNoPodio
                        pessoa={pessoa}
                        lugar={coluna.lugar}
                        largura={coluna.largura}
                        eu={pessoa.jogadorId === sala.meuId}
                        reduzir={Boolean(reduzir)}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <Degrau
                  lugar={coluna.lugar}
                  pontos={revelado ? pessoa.pontos : null}
                  atraso={0.15 * i}
                  reduzir={Boolean(reduzir)}
                />
              </div>
            );
          })}
        </div>
        <div className="relative h-3 rounded-b-xl border-x-[3px] border-b-[3px] border-[#0b1638] bg-[#2a49b8]" aria-hidden="true" />
      </div>
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
            <p className="cartao mx-auto mt-5 max-w-md px-4 py-3 text-center text-lg font-extrabold">
              {eu.posicao === 1
                ? 'Você ganhou! 🏆'
                : eu.posicao <= 3
                  ? `Você está no pódio, em ${eu.posicao}º lugar! 🎉`
                  : `Você ficou em ${eu.posicao}º lugar`}
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

/** O bonequinho cai do alto e quica no degrau. Quem ganhou pula de alegria, com raios atrás. */
function PessoaNoPodio({
  pessoa,
  lugar,
  largura,
  eu,
  reduzir,
}: {
  pessoa: Pessoa;
  lugar: number;
  largura: number;
  eu: boolean;
  reduzir: boolean;
}) {
  const primeiro = lugar === 1;
  return (
    <motion.div
      className="relative flex w-full flex-col items-center gap-1"
      initial={reduzir ? false : { y: -340, opacity: 0, rotate: lugar === 2 ? -20 : 20 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 13 }}
    >
      {primeiro && !reduzir && (
        <motion.div
          className="absolute top-6 -z-10 size-48 rounded-full opacity-70"
          style={{
            background: 'repeating-conic-gradient(from 0deg, rgb(255 255 255 / 0.8) 0deg 10deg, transparent 10deg 24deg)',
            maskImage: 'radial-gradient(circle, black 25%, transparent 68%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        />
      )}
      <PlacaNome nome={pessoa.apelido} eu={eu} />
      <motion.div
        animate={primeiro && !reduzir ? { y: [0, -12, 0] } : undefined}
        transition={{ delay: 0.9, duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }}
      >
        <Bonequinho avatar={pessoa.avatar} largura={largura} />
      </motion.div>
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
