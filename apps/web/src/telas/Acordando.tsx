import { motion, useReducedMotion } from 'framer-motion';
import { Tic } from '../componentes/Tic';
import { URL_SERVIDOR, problemaDeConfiguracao, tentarDeNovo, useJogo } from '../lib/jogo';

/**
 * O servidor grátis dorme quando fica parado e leva até um minuto para ligar.
 * Esta tela segura a pessoa enquanto isso, com o Tic tirando um cochilo.
 * Se o site foi publicado sem o endereço do servidor, ou se ele não acorda,
 * a tela explica o que falta em vez de esperar para sempre.
 */
export function Acordando({ problema }: { problema?: 'configuracao' | 'demora' }) {
  const reduzir = useReducedMotion();
  const { erroConexao } = useJogo();
  const animar = !reduzir && !problema;

  return (
    <main
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center"
      role={problema ? 'alert' : 'status'}
      aria-live="polite"
    >
      <motion.div
        animate={animar ? { rotate: [-4, 4, -4], y: [0, -8, 0] } : undefined}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Tic tamanho={150} humor="dormindo" />
      </motion.div>

      {!problema && (
        <>
          <h1 className="titulo text-4xl">Acordando o servidor…</h1>
          <p className="font-semibold text-texto-suave">
            O Tic tira um cochilo quando ninguém está jogando. A primeira entrada depois disso pode levar até um minuto.
          </p>
          <div className="flex gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-3.5 rounded-full border-2 border-[#0b1638] bg-amarelo"
                animate={reduzir ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </>
      )}

      {problema === 'configuracao' && (
        <>
          <h1 className="titulo text-4xl">Falta ligar o servidor</h1>
          <p className="cartao p-4 text-left font-semibold">{problemaDeConfiguracao()}</p>
          <p className="text-sm font-semibold text-texto-suave">
            Endereço configurado hoje: <code className="chip">{URL_SERVIDOR}</code>
          </p>
        </>
      )}

      {problema === 'demora' && (
        <>
          <h1 className="titulo text-4xl">O servidor não respondeu</h1>
          <p className="font-semibold text-texto-suave">
            Já passou mais de um minuto. Ou o servidor está fora do ar, ou o endereço configurado está errado.
          </p>
          <button type="button" className="botao botao-amarelo w-full max-w-xs text-2xl" onClick={tentarDeNovo}>
            Tentar de novo
          </button>
          <details className="w-full text-left text-sm font-semibold text-texto-suave">
            <summary className="cursor-pointer text-center">Detalhes para quem cuida do site</summary>
            <div className="vidro mt-2 space-y-1 p-3">
              <p>
                Servidor: <code>{URL_SERVIDOR}</code>
              </p>
              {erroConexao && (
                <p>
                  Último erro: <code>{erroConexao}</code>
                </p>
              )}
              <p>
                Confira se o serviço no Render está "Live", se <code>{URL_SERVIDOR}/health</code> abre no navegador e se o
                endereço do site está em <code>ORIGENS_PERMITIDAS</code>.
              </p>
            </div>
          </details>
        </>
      )}
    </main>
  );
}
