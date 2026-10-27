import { estaMudo } from './preferencias';

/**
 * Todos os sons são sintetizados na hora com Web Audio: são originais
 * por construção e não pesam nada no download.
 */
let contexto: AudioContext | null = null;

function audio(): AudioContext | null {
  if (estaMudo() || typeof AudioContext === 'undefined') return null;
  contexto ??= new AudioContext();
  if (contexto.state === 'suspended') void contexto.resume();
  return contexto;
}

function nota(
  ctx: AudioContext,
  frequencia: number,
  inicio: number,
  duracao: number,
  { tipo = 'triangle' as OscillatorType, volume = 0.18, ate }: { tipo?: OscillatorType; volume?: number; ate?: number } = {},
) {
  const osc = ctx.createOscillator();
  const ganho = ctx.createGain();
  const t = ctx.currentTime + inicio;
  osc.type = tipo;
  osc.frequency.setValueAtTime(frequencia, t);
  if (ate) osc.frequency.exponentialRampToValueAtTime(ate, t + duracao);
  ganho.gain.setValueAtTime(0.0001, t);
  ganho.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
  osc.connect(ganho).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duracao + 0.05);
}

function ruido(ctx: AudioContext, inicio: number, duracao: number, volume: number, corte: number) {
  const tamanho = Math.ceil(ctx.sampleRate * duracao);
  const buffer = ctx.createBuffer(1, tamanho, ctx.sampleRate);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < tamanho; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / tamanho) ** 2;
  const fonte = ctx.createBufferSource();
  fonte.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = corte;
  const ganho = ctx.createGain();
  ganho.gain.value = volume;
  fonte.connect(filtro).connect(ganho).connect(ctx.destination);
  fonte.start(ctx.currentTime + inicio);
}

export const sons = {
  /** Cada letra passando no sorteio: um "tic" de lápis batendo na mesa. */
  tique() {
    const ctx = audio();
    if (!ctx) return;
    nota(ctx, 1500, 0, 0.035, { tipo: 'square', volume: 0.05 });
  },
  /** A letra parou. */
  letra() {
    const ctx = audio();
    if (!ctx) return;
    nota(ctx, 660, 0, 0.18);
    nota(ctx, 990, 0.09, 0.32);
  },
  /** Alguém gritou STOP: apito em dois tempos. */
  stop() {
    const ctx = audio();
    if (!ctx) return;
    nota(ctx, 1046, 0, 0.16, { tipo: 'sawtooth', volume: 0.09, ate: 1318 });
    nota(ctx, 1318, 0.2, 0.35, { tipo: 'sawtooth', volume: 0.09, ate: 1046 });
  },
  /** Cada número da contagem 3, 2, 1. */
  contagem() {
    const ctx = audio();
    if (!ctx) return;
    nota(ctx, 523, 0, 0.12, { tipo: 'sine', volume: 0.12 });
  },
  /** Carimbo batendo no papel. */
  carimbo() {
    const ctx = audio();
    if (!ctx) return;
    nota(ctx, 140, 0, 0.12, { tipo: 'sine', volume: 0.35, ate: 60 });
    ruido(ctx, 0, 0.09, 0.25, 1800);
  },
  /** Pódio: arpejo subindo. */
  podio() {
    const ctx = audio();
    if (!ctx) return;
    [523, 659, 784, 1046].forEach((f, i) => nota(ctx, f, i * 0.12, 0.3, { volume: 0.14 }));
    nota(ctx, 1318, 0.5, 0.6, { volume: 0.12 });
  },
  /** Confirmação discreta (pronto, voto). */
  pop() {
    const ctx = audio();
    if (!ctx) return;
    nota(ctx, 880, 0, 0.07, { tipo: 'sine', volume: 0.1, ate: 1200 });
  },
};
