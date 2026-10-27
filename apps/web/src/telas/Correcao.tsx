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
        className={`adesivo h-14 flex-1 text-xl ${estouPronto ? 'adesivo-azul' : 'adesivo-amarelo'}`}
        disabled={estouPronto}
        onClick={() => {
          sons.pop();
          acoes.prontoCorrecao(correcao.indice);
        }}
      >
        {estouPronto ? '✓ Pronto' : correcao.indice + 1 < total ? 'Pronto, próxima!' : 'Pronto, ver pontos!'}
      </button>
      <p className="w-24 text-sm font-bold leading-tight text-tinta-suave" aria-live="polite">
        {prontos} de {esperando.length} prontos
      </p>
    </div>
  ) : (
    <p className="text-center font-bold text-tinta-suave">Você entra na próxima rodada. Pode ir assistindo!</p>
  );

  return (
    <Tela rodape={rodape}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-tinta-suave">
            Correção · letra {letra} · {correcao.indice + 1} de {total}
          </p>
          <h1 className="font-mao text-4xl font-bold leading-tight">
            {correcao.categoria}
            {Object.hasOwn(DICAS_CATEGORIA, correcao.categoria) && (
              <span className="block font-sans text-base font-semibold text-tinta-suave">
                {DICAS_CATEGORIA[correcao.categoria]}
              </span>
            )}
          </h1>
        </div>
        <Cronometro terminaEm={sala.terminaEm} />
      </div>

      <div className="mb-4 flex gap-1" aria-hidden="true">
        {sala.config.categorias.map((c, i) => (
          <span
            key={c}
            className={`h-1.5 flex-1 rounded-full ${i < correcao.indice ? 'bg-tinta-suave' : i === correcao.indice ? 'bg-caneta' : 'bg-tinta/15'}`}
          />
        ))}
      </div>

      <p className="mb-4 text-sm text-tinta-suave">
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
              className="rounded-xl border-2 border-tinta/20 bg-papel p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar id={r.avatar} tamanho={36} />
                <span className="min-w-0 flex-1 truncate font-bold">
                  {r.apelido}
                  {minha && <span className="font-semibold text-tinta-suave"> (você)</span>}
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
                className={`mt-1 break-words pl-12 font-mao text-3xl leading-tight ${
                  anulada ? 'text-tinta-suave line-through decoration-errado decoration-2' : 'text-caneta'
                }`}
              >
                {r.texto || <span className="text-xl italic">(em branco)</span>}
              </p>

              {!r.motivo && (
                <div className="mt-2 flex items-center gap-2 pl-12">
                  {minha || !souParticipante ? (
                    <span className="text-sm font-bold text-tinta-suave">
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
      className={`flex h-11 min-w-16 items-center justify-center gap-1.5 rounded-full border-2 px-3 text-lg font-bold transition active:scale-95 ${
        ativo ? 'border-caneta bg-marca-texto/60 ring-2 ring-caneta' : 'border-tinta/25'
      }`}
    >
      {children}
    </button>
  );
}
