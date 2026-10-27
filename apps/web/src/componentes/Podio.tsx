import { motion } from 'framer-motion';
import { useEffect, useId, useState } from 'react';
import { nomeDoAvatar, recorteDoAvatar } from './Avatar';

const CONTORNO = '#0b1638';
/** Enquanto a cor do bicho não foi lida da imagem. */
const COR_PROVISORIA = '#c9cfdd';

const MEIO_CIRCULO = 'M3 44A47 41 0 0 1 97 44Z';

const coresLidas = new Map<string, string | null>();

/**
 * A cor do corpo do bicho: a que mais aparece no pedacinho de pescoço logo acima do corte de baixo
 * do desenho, sem contar o contorno escuro. Assim o meio círculo continua o corpo dele.
 */
function corDoPescoco(img: HTMLImageElement): string | null {
  const lado = 64;
  const tela = document.createElement('canvas');
  tela.width = tela.height = lado;
  const ctx = tela.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, lado, lado);
  const { data } = ctx.getImageData(0, 0, lado, lado);
  const alfa = (x: number, y: number) => data[(y * lado + x) * 4 + 3]!;

  let base = lado - 1;
  while (base > 0 && !Array.from({ length: lado }, (_, x) => alfa(x, base) > 200).some(Boolean)) base--;

  const grupos = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let y = Math.max(0, base - 4); y < base; y++) {
    for (let x = 0; x < lado; x++) {
      const i = (y * lado + x) * 4;
      const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
      if (data[i + 3]! < 200 || r + g + b < 160) continue;
      const chave = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
      const grupo = grupos.get(chave) ?? { r: 0, g: 0, b: 0, n: 0 };
      grupo.r += r;
      grupo.g += g;
      grupo.b += b;
      grupo.n++;
      grupos.set(chave, grupo);
    }
  }
  let maior: { r: number; g: number; b: number; n: number } | undefined;
  for (const grupo of grupos.values()) if (!maior || grupo.n > maior.n) maior = grupo;
  if (!maior || maior.n < 6) return null;
  return `rgb(${Math.round(maior.r / maior.n)} ${Math.round(maior.g / maior.n)} ${Math.round(maior.b / maior.n)})`;
}

function useCorDoPescoco(src: string): string {
  const [cor, setCor] = useState(() => coresLidas.get(src) ?? null);
  useEffect(() => {
    if (coresLidas.has(src)) return;
    let ativo = true;
    const img = new Image();
    img.src = src;
    img
      .decode()
      .then(() => {
        const lida = corDoPescoco(img);
        coresLidas.set(src, lida);
        if (ativo) setCor(lida);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [src]);
  return cor ?? COR_PROVISORIA;
}

/**
 * Bonequinho do pódio: o rostinho do bicho apoiado num meio círculo da cor do corpo dele,
 * como um busto. O meio círculo fica atrás da imagem, então o corte de baixo do pescoço some nele.
 */
export function Bonequinho({ avatar, largura }: { avatar: number; largura: number }) {
  const id = useId().replace(/:/g, '');
  const src = recorteDoAvatar(avatar);
  const cor = useCorDoPescoco(src);
  return (
    <div className="relative flex flex-col items-center" style={{ width: largura }} role="img" aria-label={nomeDoAvatar(avatar)}>
      <img src={src} alt="" draggable={false} className="relative z-[1] block w-full select-none" />
      <svg viewBox="0 0 100 46" className="-mt-[15%] block w-[70%] overflow-visible" aria-hidden="true">
        <defs>
          <clipPath id={`pescoco-${id}`}>
            <path d={MEIO_CIRCULO} />
          </clipPath>
          <radialGradient id={`queixo-${id}`} cx="50%" cy="0%" r="50%" fx="50%" fy="0%">
            <stop offset="0" stopColor="#000" stopOpacity=".35" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Sombra no degrau */}
        <ellipse cx="50" cy="45" rx="52" ry="4" fill="#000" opacity=".25" />
        <path d={MEIO_CIRCULO} fill={cor} style={{ transition: 'fill .3s' }} />
        <g clipPath={`url(#pescoco-${id})`}>
          {/* Sombra do queixo, para a cabeça ficar na frente do corpo */}
          <ellipse cx="50" cy="2" rx="42" ry="26" fill={`url(#queixo-${id})`} />
          {/* Brilho do lado esquerdo e sombra do lado direito, como os degraus */}
          <ellipse cx="24" cy="26" rx="9" ry="16" fill="#fff" opacity=".3" />
          <path d="M70 0C84 8 94 24 97 44H66C70 30 71 14 70 0Z" fill="#000" opacity=".16" />
        </g>
        <path d={MEIO_CIRCULO} fill="none" stroke={CONTORNO} strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const MEDALHAS = {
  1: { cima: '#ffe27a', baixo: '#f5a623', borda: '#a86a00' },
  2: { cima: '#f3f6fb', baixo: '#aeb8cc', borda: '#5d6880' },
  3: { cima: '#ffb98a', baixo: '#e0662b', borda: '#8f3a12' },
} as const;

/** Escudo com o número da posição, como medalha de jogo. */
export function Medalha({ lugar, tamanho = 64 }: { lugar: 1 | 2 | 3; tamanho?: number }) {
  const id = useId().replace(/:/g, '');
  const c = MEDALHAS[lugar];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`m-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.cima} />
          <stop offset="1" stopColor={c.baixo} />
        </linearGradient>
      </defs>
      <path d="M32 3L60 22L50 58H14L4 22Z" fill={c.borda} transform="translate(0 3)" />
      <path d="M32 3L60 22L50 58H14L4 22Z" fill={`url(#m-${id})`} stroke={CONTORNO} strokeWidth="3" strokeLinejoin="round" />
      <path d="M32 9L53 23.5L45.5 52H18.5L11 23.5Z" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
      <text
        x="32"
        y="45"
        textAnchor="middle"
        fontFamily="'Lilita One', sans-serif"
        fontSize="30"
        fill="#fff"
        stroke={CONTORNO}
        strokeWidth="4"
        paintOrder="stroke"
      >
        {lugar}
      </text>
    </svg>
  );
}

const ALTURAS = { 1: 188, 2: 150, 3: 118 } as const;
const FRENTES = {
  1: 'linear-gradient(180deg, #6f93ff 0%, #4a6fe8 100%)',
  2: 'linear-gradient(180deg, #5a80f2 0%, #3a5bd0 100%)',
  3: 'linear-gradient(180deg, #5a80f2 0%, #3a5bd0 100%)',
} as const;

/**
 * Degrau em 3D: tampa de cima em perspectiva, frente com degradê e uma lateral escura.
 * O 1º fica na frente e mais claro; o 2º e o 3º ficam um pouco atrás.
 */
export function Degrau({
  lugar,
  pontos,
  atraso = 0,
  reduzir = false,
}: {
  lugar: 1 | 2 | 3;
  pontos: number | null;
  atraso?: number;
  reduzir?: boolean;
}) {
  const altura = ALTURAS[lugar];
  const lateral = lugar === 2 ? 'left' : lugar === 3 ? 'right' : null;
  return (
    <motion.div
      className="relative w-full"
      style={{ height: altura, originY: 1, zIndex: lugar === 1 ? 2 : 1 }}
      initial={reduzir ? false : { scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ delay: atraso, type: 'spring', stiffness: 150, damping: 18 }}
    >
      {/* Tampa de cima, vista em perspectiva */}
      <div
        className="absolute inset-x-0 -top-3 h-3"
        style={{
          background: lugar === 1 ? '#a9c0ff' : '#8eaaf8',
          clipPath: 'polygon(6% 0, 94% 0, 100% 100%, 0 100%)',
        }}
      />
      {/* Frente */}
      <div
        className="absolute inset-0 flex flex-col items-center gap-1 border-x-[3px] border-t-[3px] border-[#0b1638] pt-4"
        style={{ background: FRENTES[lugar] }}
      >
        {/* Lateral escura, dando profundidade nos degraus de trás */}
        {lateral && (
          <div
            className={`absolute inset-y-0 w-3 bg-black/25 ${lateral === 'left' ? 'left-0' : 'right-0'}`}
            aria-hidden="true"
          />
        )}
        <Medalha lugar={lugar} tamanho={lugar === 1 ? 70 : 60} />
        {pontos !== null && (
          <span className="font-titulo text-2xl text-white [text-shadow:0_3px_0_#0b1638]">
            {pontos}
            <span className="sr-only"> pontos</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}

/** Plaquinha branca com o nome, em cima do bonequinho. A sua fica amarela. */
export function PlacaNome({ nome, eu }: { nome: string; eu: boolean }) {
  return (
    <span
      className={`max-w-full truncate rounded-xl border-[3px] border-[#0b1638] px-2.5 py-0.5 font-titulo text-lg leading-tight text-[#0b1638] shadow-[0_3px_0_#0b1638] ${
        eu ? 'bg-amarelo' : 'bg-white'
      }`}
    >
      {nome}
    </span>
  );
}
