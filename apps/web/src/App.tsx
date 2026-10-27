import { MotionConfig } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Aviso } from './componentes/Aviso';
import { Cabecalho } from './componentes/Cabecalho';
import { ReacoesFlutuando } from './componentes/Reacoes';
import { conectar, useJogo } from './lib/jogo';
import { Acordando } from './telas/Acordando';
import { Correcao } from './telas/Correcao';
import { Fim } from './telas/Fim';
import { Inicio } from './telas/Inicio';
import { Lobby } from './telas/Lobby';
import { Respostas } from './telas/Respostas';
import { Resultado } from './telas/Resultado';
import { Sorteio } from './telas/Sorteio';

/** Só mostra "Acordando o servidor…" se a conexão demorar; numa conexão rápida a tela nem pisca. */
const ESPERA_ANTES_DE_AVISAR_MS = 1200;

export function App() {
  const { conexao, restaurando } = useJogo();
  const [demorou, setDemorou] = useState(false);

  useEffect(() => {
    conectar();
    const id = setTimeout(() => setDemorou(true), ESPERA_ANTES_DE_AVISAR_MS);
    return () => clearTimeout(id);
  }, []);

  if (conexao === 'sem-configuracao') return <Acordando problema="configuracao" />;
  if (conexao === 'nao-acordou') return <Acordando problema="demora" />;
  if (conexao === 'acordando') return demorou ? <Acordando /> : null;
  if (restaurando) return null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <Cabecalho />
        <Conteudo />
        <ReacoesFlutuando />
        <Aviso />
      </div>
    </MotionConfig>
  );
}

function Conteudo() {
  const { sala } = useJogo();
  if (!sala) return <Inicio />;
  switch (sala.fase) {
    case 'lobby':
      return <Lobby sala={sala} />;
    case 'sorteio':
      return <Sorteio key={`${sala.rodada}-${sala.letra}`} sala={sala} />;
    case 'respostas':
    case 'travando':
      // A chave muda também quando a sala pula a letra: os campos começam vazios de novo.
      return <Respostas key={`${sala.rodada}-${sala.letra}`} sala={sala} />;
    case 'correcao':
      return <Correcao sala={sala} />;
    case 'resultado':
      return <Resultado key={sala.rodada} sala={sala} />;
    case 'fim':
      return <Fim sala={sala} />;
  }
}
