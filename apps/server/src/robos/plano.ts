import type { NivelRobo, Voto } from '@rabisco/shared';

type Faixa = readonly [min: number, max: number];

/**
 * Como cada nível joga. Os tempos são de gente digitando no celular: ninguém lembra
 * uma palavra em menos de 2 segundos, nem digita mais que umas 6 letras por segundo.
 */
interface Perfil {
  /** Lendo a letra antes de começar a primeira resposta. */
  comeco: Faixa;
  /** Lembrando de uma palavra. */
  pensar: Faixa;
  /** Por letra digitada. */
  porLetra: Faixa;
  /** Chance de travar numa categoria e deixar em branco. */
  branco: number;
  /** Chance de escrever algo que não é da categoria (vale para a turma anular). */
  erro: number;
  /** Chance de trocar a ordem com a categoria seguinte (pular uma e voltar depois). */
  pular: number;
  /** Conferindo tudo antes de apertar STOP. */
  conferir: Faixa;
  /** De qual parte da lista de ideias ele tira a resposta (0 = a mais comum). */
  escolha: (quantas: number, aleatorio: () => number) => number;
  /** Chance de votar em cada resposta dos outros. */
  votar: number;
  /** Chance de anular uma resposta que não vale (o resto ele deixa passar). */
  rigor: number;
  /** Lendo a folha antes de apertar "Pronto". */
  lerResultado: Faixa;
}

export const PERFIS: Record<NivelRobo, Perfil> = {
  facil: {
    comeco: [1800, 3800],
    pensar: [5500, 11_000],
    porLetra: [260, 400],
    branco: 0.28,
    erro: 0.08,
    pular: 0.3,
    conferir: [2500, 5000],
    // Vai no óbvio: quase sempre a primeira ideia, que todo mundo também escreve.
    escolha: (n, a) => Math.min(n - 1, a() < 0.7 ? 0 : 1),
    votar: 0.35,
    rigor: 0.8,
    lerResultado: [6000, 14_000],
  },
  medio: {
    comeco: [1200, 2800],
    pensar: [3500, 7500],
    porLetra: [190, 300],
    branco: 0.12,
    erro: 0.04,
    pular: 0.2,
    conferir: [1500, 3500],
    escolha: (n, a) => Math.floor(a() * Math.min(n, 4)),
    votar: 0.6,
    rigor: 0.95,
    lerResultado: [4000, 10_000],
  },
  dificil: {
    comeco: [900, 1900],
    pensar: [2200, 5000],
    porLetra: [150, 230],
    branco: 0.04,
    erro: 0.01,
    pular: 0.1,
    conferir: [900, 2200],
    // Foge do óbvio para não repetir com ninguém (resposta única vale 10).
    escolha: (n, a) => (n <= 1 ? 0 : 1 + Math.floor(a() * (n - 1))),
    votar: 0.85,
    rigor: 1,
    lerResultado: [3000, 8000],
  },
};

export function sortearEntre([min, max]: Faixa, aleatorio: () => number): number {
  return Math.round(min + (max - min) * aleatorio());
}

export interface PassoDeEscrita {
  categoria: string;
  texto: string;
  /** Quando a resposta fica pronta, em ms desde o começo da rodada. */
  emMs: number;
  /** Falso quando o robô escreveu de propósito algo de outra categoria. */
  vale: boolean;
}

export interface PlanoDaRodada {
  passos: PassoDeEscrita[];
  /** Quando ele aperta STOP, ou null se não vai preencher tudo. */
  stopEmMs: number | null;
}

/**
 * O que o robô vai escrever e quando, do jeito que uma pessoa faria: vai mais ou menos
 * na ordem das categorias, às vezes pula uma e volta, demora mais nas ideias raras e
 * trava em algumas. Se o tempo da rodada acabar antes, o que faltou fica em branco.
 */
export function planejarRodada(
  nivel: NivelRobo,
  categorias: string[],
  ideias: string[][],
  aleatorio: () => number,
): PlanoDaRodada {
  const perfil = PERFIS[nivel];
  const ordem = categorias.map((_, i) => i);
  for (let i = 0; i + 1 < ordem.length; i++) {
    if (aleatorio() < perfil.pular) [ordem[i], ordem[i + 1]] = [ordem[i + 1]!, ordem[i]!];
  }

  const passos: PassoDeEscrita[] = [];
  let agora = sortearEntre(perfil.comeco, aleatorio);
  let emBranco = false;
  for (const i of ordem) {
    const opcoes = ideias[i] ?? [];
    if (opcoes.length === 0 || aleatorio() < perfil.branco) {
      // Ficou um tempo tentando lembrar e desistiu.
      agora += sortearEntre(perfil.pensar, aleatorio) / 2;
      emBranco = true;
      continue;
    }

    let texto: string;
    let vale = true;
    const deOutra = ideias.flatMap((outras, k) => (k === i ? [] : outras));
    if (deOutra.length > 0 && aleatorio() < perfil.erro) {
      texto = deOutra[Math.floor(aleatorio() * deOutra.length)]!;
      vale = false;
    } else {
      const indice = perfil.escolha(opcoes.length, aleatorio);
      texto = opcoes[indice]!;
      // Ideia rara demora mais para vir.
      agora += sortearEntre(perfil.pensar, aleatorio) * 0.12 * indice;
    }

    agora += sortearEntre(perfil.pensar, aleatorio);
    for (let letra = 0; letra < texto.length; letra++) agora += sortearEntre(perfil.porLetra, aleatorio);
    passos.push({ categoria: categorias[i]!, texto, emMs: agora, vale });
  }

  return { passos, stopEmMs: emBranco ? null : agora + sortearEntre(perfil.conferir, aleatorio) };
}

/**
 * O voto do robô numa resposta de outra pessoa: null quando ele não vota.
 * Ele só anula o que acha que não vale; quando não sabe, fica quieto.
 */
export function decidirVoto(nivel: NivelRobo, vale: boolean | null, aleatorio: () => number): Voto | null {
  const perfil = PERFIS[nivel];
  if (vale === null || aleatorio() >= perfil.votar) return null;
  if (vale) return 'sim';
  return aleatorio() < perfil.rigor ? 'nao' : 'sim';
}
