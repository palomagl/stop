import { LayoutGroup, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { EstadoSala } from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { Cronometro } from '../componentes/Cronometro';
import { Tela } from '../componentes/Tela';
import { acoes } from '../lib/jogo';
import { sons } from '../lib/sons';

export function Resultado({ sala }: { sala: EstadoSala }) {
  const resultado = sala.resultado!;
  const ultima = sala.rodada >= sala.config.rodadas;
  const estouPronto = resultado.prontos.includes(sala.meuId);
  const online = sala.jogadores.filter((j) => j.online);
  const prontos = online.filter((j) => resultado.prontos.includes(j.id)).length;

  // Primeiro mostra a ordem antiga; depois de um instante as linhas trocam de lugar.
  const [reordenado, setReordenado] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReordenado(true), 1100);
    return () => clearTimeout(id);
  }, []);

  const linhas = [...resultado.linhas].sort((a, b) =>
    reordenado ? a.posicao - b.posicao : a.posicaoAnterior - b.posicaoAnterior || a.apelido.localeCompare(b.apelido),
  );

  const rodape = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className={`botao h-14 flex-1 whitespace-nowrap px-3 text-xl disabled:opacity-90 ${estouPronto ? 'botao-menta' : 'botao-amarelo'}`}
        disabled={estouPronto}
        onClick={() => {
          sons.pop();
          acoes.prontoResultado(sala.rodada);
        }}
      >
        {estouPronto ? '✓ Pronto' : ultima ? 'Ver o pódio!' : 'Próxima rodada!'}
      </button>
      <div className="w-24 text-sm font-extrabold leading-tight text-texto-suave">
        <span aria-live="polite">
          {prontos} de {online.length} prontos
        </span>
        <span className="flex items-center gap-1">
          segue em <Cronometro terminaEm={sala.terminaEm} />
        </span>
      </div>
    </div>
  );

  return (
    <Tela rodape={rodape}>
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-texto-suave">
        Letra {sala.letra} · rodada {sala.rodada} de {sala.config.rodadas}
      </p>
      <h1 className="titulo mt-1 mb-5 text-4xl">Placar da rodada</h1>

      <LayoutGroup>
        <ol className="flex flex-col gap-2">
          {linhas.map((l) => {
            const subiu = reordenado && l.posicao < l.posicaoAnterior;
            return (
              <motion.li
                key={l.jogadorId}
                layout
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className={`cartao flex items-center gap-3 px-2.5 py-2 ${
                  l.jogadorId === sala.meuId ? 'ring-4 ring-amarelo' : ''
                }`}
              >
                <span className="w-9 text-center font-titulo text-3xl">{reordenado ? l.posicao : l.posicaoAnterior}º</span>
                <Avatar id={l.avatar} tamanho={48} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-extrabold leading-tight">{l.apelido}</span>
                  {subiu && (
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-black uppercase text-certo"
                    >
                      ▲ subiu {l.posicaoAnterior - l.posicao}
                    </motion.span>
                  )}
                </span>
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: -6 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="font-titulo text-3xl text-coral [text-shadow:0_2px_0_#0b1638]"
                  aria-label={`${l.pontosRodada} pontos nesta rodada`}
                >
                  +{l.pontosRodada}
                </motion.span>
                <span className="w-16 text-right">
                  <span className="block text-xs font-extrabold uppercase tracking-wider text-tinta-suave">total</span>
                  <span className="font-titulo text-3xl">{l.total}</span>
                </span>
              </motion.li>
            );
          })}
        </ol>
      </LayoutGroup>
    </Tela>
  );
}
