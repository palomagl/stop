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
        className={`adesivo h-14 flex-1 text-xl ${estouPronto ? 'adesivo-azul' : 'adesivo-amarelo'}`}
        disabled={estouPronto}
        onClick={() => {
          sons.pop();
          acoes.prontoResultado(sala.rodada);
        }}
      >
        {estouPronto ? '✓ Pronto' : ultima ? 'Ver o pódio!' : 'Próxima rodada!'}
      </button>
      <div className="w-24 text-sm font-bold leading-tight text-tinta-suave">
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
      <p className="text-sm font-bold text-tinta-suave">
        Letra {sala.letra} · rodada {sala.rodada} de {sala.config.rodadas}
      </p>
      <h1 className="mb-5 font-mao text-4xl font-bold">Placar da rodada</h1>

      <LayoutGroup>
        <ol className="flex flex-col gap-2">
          {linhas.map((l) => {
            const subiu = reordenado && l.posicao < l.posicaoAnterior;
            return (
              <motion.li
                key={l.jogadorId}
                layout
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className={`flex items-center gap-3 rounded-xl border-2 bg-papel px-3 py-2 ${
                  l.jogadorId === sala.meuId ? 'border-caneta' : 'border-tinta/20'
                }`}
              >
                <span className="w-8 text-center font-mao text-3xl font-bold">{reordenado ? l.posicao : l.posicaoAnterior}º</span>
                <Avatar id={l.avatar} tamanho={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{l.apelido}</span>
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
                  className="font-mao text-3xl font-bold text-errado"
                  aria-label={`${l.pontosRodada} pontos nesta rodada`}
                >
                  +{l.pontosRodada}
                </motion.span>
                <span className="w-16 text-right">
                  <span className="block text-xs font-bold text-tinta-suave">total</span>
                  <span className="font-mao text-3xl font-bold">{l.total}</span>
                </span>
              </motion.li>
            );
          })}
        </ol>
      </LayoutGroup>
    </Tela>
  );
}
