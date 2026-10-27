import { motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import type { EstadoSala } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { Confete } from '../componentes/Confete';
import { Tela } from '../componentes/Tela';
import { acoes } from '../lib/jogo';
import { sons } from '../lib/sons';

const DEGRAUS = [
  { posicao: 2, altura: 'h-28', cor: 'bg-[#dfe6f5]', atraso: 0.5 },
  { posicao: 1, altura: 'h-40', cor: 'bg-[#ffd23f]', atraso: 0.9 },
  { posicao: 3, altura: 'h-20', cor: 'bg-[#ffb07a]', atraso: 0.2 },
];

export function Fim({ sala }: { sala: EstadoSala }) {
  const fim = sala.fim!;
  const souDono = sala.jogadores.find((j) => j.id === sala.meuId)?.dono ?? false;
  const dono = sala.jogadores.find((j) => j.dono);
  const podio = fim.classificacao.slice(0, 3);
  const resto = fim.classificacao.slice(3);
  const { resumo } = fim;

  useEffect(() => {
    const id = setTimeout(() => sons.podio(), 700);
    return () => clearTimeout(id);
  }, []);

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
      <Confete />
      <h1 className="titulo text-center text-5xl">Fim de jogo!</h1>

      <div className="mx-auto mt-6 flex max-w-md items-end justify-center gap-2" role="list" aria-label="Pódio">
        {DEGRAUS.map((degrau) => {
          // Com empate, pode haver mais de uma pessoa na mesma posição; o pódio mostra as 3 primeiras da lista.
          const indice = degrau.posicao - 1;
          const jogador = podio[indice];
          if (!jogador) return <div key={degrau.posicao} className="flex-1" />;
          return (
            <motion.div
              key={degrau.posicao}
              role="listitem"
              className="flex flex-1 flex-col items-center"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: degrau.atraso, type: 'spring', stiffness: 200, damping: 16 }}
            >
              {degrau.posicao === 1 && (
                <span className="text-4xl" aria-hidden="true">
                  👑
                </span>
              )}
              <Avatar id={jogador.avatar} tamanho={degrau.posicao === 1 ? 84 : 64} className="shadow-[0_4px_0_#0b1638]" />
              <span className="mt-1 max-w-full truncate px-1 text-lg font-extrabold leading-normal">{jogador.apelido}</span>
              <span className="chip mb-1 py-0">{jogador.pontos} pts</span>
              <div
                className={`grid w-full place-items-start justify-center rounded-t-2xl border-[3px] border-b-0 border-[#0b1638] pt-2 ${degrau.altura} ${degrau.cor}`}
              >
                <span className="font-titulo text-5xl text-[#0b1638]">
                  {jogador.posicao}
                  <span className="sr-only">º lugar</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mx-auto h-[6px] max-w-md rounded-full bg-[#0b1638]" aria-hidden="true" />

      {resto.length > 0 && (
        <ol className="mx-auto mt-6 flex max-w-md flex-col gap-2">
          {resto.map((j) => (
            <li key={j.jogadorId} className="cartao flex items-center gap-3 px-2.5 py-2">
              <span className="w-9 text-center font-titulo text-2xl">{j.posicao}º</span>
              <Avatar id={j.avatar} tamanho={40} />
              <span className="flex-1 truncate font-extrabold">{j.apelido}</span>
              <span className="font-titulo text-2xl">{j.pontos}</span>
            </li>
          ))}
        </ol>
      )}

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

      <div className="mt-8 text-center">
        <button type="button" className="chip px-4 py-2 hover:bg-white/20" onClick={acoes.sair}>
          Sair da sala
        </button>
      </div>
    </Tela>
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
