import { useEffect, useState } from 'react';

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function jaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches;
}

/** iPhone não tem o pedido automático de instalação: só dá para ensinar o caminho. */
function ehIphone() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function BotaoInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);

  useEffect(() => {
    const guardar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    window.addEventListener('beforeinstallprompt', guardar);
    return () => window.removeEventListener('beforeinstallprompt', guardar);
  }, []);

  if (jaInstalado()) return null;

  if (evento) {
    return (
      <button
        type="button"
        className="chip mx-auto px-4 py-2 hover:bg-white/20"
        onClick={async () => {
          await evento.prompt();
          await evento.userChoice;
          setEvento(null);
        }}
      >
        📲 Instalar o jogo no celular
      </button>
    );
  }

  if (ehIphone()) {
    return (
      <p className="text-center text-sm font-semibold text-texto-suave">
        📲 Para instalar: toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
      </p>
    );
  }

  return null;
}
