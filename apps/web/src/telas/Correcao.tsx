import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  DICAS_CATEGORIA,
  PONTOS,
  anuladaPorVotos,
  chaveResposta,
  type EstadoSala,
  type MotivoAnulacao,
  type RespostaEmCorrecao,
  type Voto,
} from '@rabisco/shared';
import { Avatar } from '../componentes/Avatar';
import { Carimbo } from '../componentes/Carimbo';
import { Cronometro } from '../componentes/Cronometro';
import { Tela } from '../componentes/Tela';
import { acoes } from '../lib/jogo';
import { sons } from '../lib/sons';

function textoMotivo(motivo: MotivoAnulacao, letra: string): string {
  if (motivo === 'vazia') return 'em branco';
  if (motivo === 'letra') return `não começa com ${letra}`;
  return 'só a letra';
}

export function Correcao({ sala }: { sala: EstadoSala }) {
  const correcao = sala.correcao!;
  const letra = sala.letra!;
  const total = sala.config.categorias.length;
  const eu = sala.jogadores.find((j) => j.id === sala.meuId);
  const souParticipante = eu?.participando ?? false;
  const estouPronto = correcao.prontos.includes(sala.meuId);
  const esperando = sala.jogadores.filter((j) => j.online && j.participando);
  const prontos = esperando.filter((j) => correcao.prontos.includes(j.id)).length;

  // Quantas respostas válidas iguais existem, para mostrar a prévia dos pontos.
  const validas = correcao.respostas.filter((r) => !r.motivo && !anuladaPorVotos(r.votos));
  const repeticoes = new Map<string, number>();
  for (const r of validas) {
    const chave = chaveResposta(r.texto);
    repeticoes.set(chave, (repeticoes.get(chave) ?? 0) + 1);
  }

  function votar(resposta: RespostaEmCorrecao, voto: Voto) {
    sons.carimbo();
    acoes.votar(correcao.indice, resposta.jogadorId, voto);
  }

  const rodape = souParticipante ? (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className={`botao h-14 flex-1 text-2xl disabled:opacity-90 ${estouPronto ? 'botao-menta' : 'botao-amarelo'}`}
        disabled={estouPronto}
        onClick={() => {
          sons.pop();
          acoes.prontoCorrecao(correcao.indice);
        }}
      >
        {estouPronto ? '✓ Pronto' : correcao.indice + 1 < total ? 'Pronto, próxima!' : 'Pronto, ver pontos!'}
      </button>
      <p className="w-24 text-sm font-extrabold leading-tight text-texto-suave" aria-live="polite">
        {prontos} de {esperando.length} prontos
      </p>
    </div>
  ) : (
    <p className="text-center font-bold text-texto-suave">Você entra na próxima rodada. Pode ir assistindo!</p>
  );

  return (
    <Tela rodape={rodape}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-texto-suave">
            Correção · letra {letra} · {correcao.indice + 1} de {total}
          </p>
          <h1 className="titulo mt-1 text-4xl uppercase">
            {correcao.categoria}
            {Object.hasOwn(DICAS_CATEGORIA, correcao.categoria) && (
              <span className="mt-1 block font-sans text-base font-bold normal-case text-texto-suave [text-shadow:none]">
                {DICAS_CATEGORIA[correcao.categoria]}
              </span>
            )}
          </h1>
        </div>
        <Cronometro terminaEm={sala.terminaEm} />
      </div>

      <div className="mb-3 flex gap-1" aria-hidden="true">
        {sala.config.categorias.map((c, i) => (
          <span
            key={c}
            className={`h-2 flex-1 rounded-full ${i < correcao.indice ? 'bg-coral/70' : i === correcao.indice ? 'bg-coral' : 'bg-white/20'}`}
          />
        ))}
      </div>

      <p className="mb-3 text-sm font-semibold text-texto-suave">
        Vote 👍 se vale ou 👎 se não vale. Maioria de 👎 anula; empate mantém.
      </p>

      <motion.ul
        key={correcao.indice}
        className="flex flex-col gap-3"
        initial="escondido"
        animate="visivel"
        variants={{ visivel: { transition: { staggerChildren: 0.06 } } }}
      >
        {correcao.respostas.map((r) => {
          const minha = r.jogadorId === sala.meuId;
          const sim = Object.values(r.votos).filter((v) => v === 'sim').length;
          const nao = Object.values(r.votos).filter((v) => v === 'nao').length;
          const meuVoto = r.votos[sala.meuId];
          const anulada = Boolean(r.motivo) || anuladaPorVotos(r.votos);
          const pontos = anulada
            ? PONTOS.anulada
            : (repeticoes.get(chaveResposta(r.texto)) ?? 0) > 1
              ? PONTOS.repetida
              : PONTOS.unica;

          return (
            <motion.li
              key={r.jogadorId}
              variants={{ escondido: { opacity: 0, x: -12 }, visivel: { opacity: 1, x: 0 } }}
              className="cartao flex gap-3 p-2.5"
            >
              <Avatar id={r.avatar} tamanho={58} className="self-start" />
              <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-tinta-suave">
                  {r.apelido}
                  {minha && <span className="font-semibold"> (você)</span>}
                </span>
                <span aria-live="polite">
                  {anulada ? (
                    <Carimbo key="errado" tipo="errado" texto={r.motivo ? textoMotivo(r.motivo, letra) : 'anulada'} />
                  ) : (
                    <Carimbo key="certo" tipo="certo" texto={`vale ${pontos}`} />
                  )}
                </span>
              </div>

              <p
                className={`break-words text-2xl font-extrabold leading-tight ${
                  anulada ? 'text-tinta-suave line-through decoration-errado decoration-[3px]' : 'text-tinta'
                }`}
              >
                {r.texto || <span className="text-lg font-semibold italic">(em branco)</span>}
              </p>

              {!r.motivo && (
                <div className="mt-1.5 flex items-center gap-2">
                  {minha || !souParticipante ? (
                    <span className="text-sm font-extrabold text-tinta-suave">
                      👍 {sim} · 👎 {nao}
                    </span>
                  ) : (
                    <>
                      <BotaoVoto ativo={meuVoto === 'sim'} onClick={() => votar(r, 'sim')} rotulo={`Vale: ${r.texto}`}>
                        👍 <span className="tabular-nums">{sim}</span>
                      </BotaoVoto>
                      <BotaoVoto ativo={meuVoto === 'nao'} onClick={() => votar(r, 'nao')} rotulo={`Não vale: ${r.texto}`}>
                        👎 <span className="tabular-nums">{nao}</span>
                      </BotaoVoto>
                    </>
                  )}
                </div>
              )}
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </Tela>
  );
}

function BotaoVoto({
  ativo,
  onClick,
  rotulo,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={rotulo}
      className={`flex h-10 min-w-16 items-center justify-center gap-1.5 rounded-full border-[3px] px-3 text-lg font-extrabold transition active:scale-95 ${
        ativo
          ? 'border-[#0b1638] bg-amarelo text-[#0b1638] shadow-[0_3px_0_#0b1638]'
          : 'border-tinta-suave/40 text-tinta'
      }`}
    >
      {children}
    </button>
  );
}
