import { useSyncExternalStore } from 'react';
import { gravar, ler } from './armazenamento';

export type Tema = 'claro' | 'escuro';

interface Preferencias {
  tema: Tema;
  mudo: boolean;
}

function temaInicial(): Tema {
  // O index.html já escolheu o tema antes de carregar o React.
  return document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro';
}

let atual: Preferencias = { tema: temaInicial(), mudo: ler<boolean>('mudo') ?? false };
const ouvintes = new Set<() => void>();

function mudar(parcial: Partial<Preferencias>) {
  atual = { ...atual, ...parcial };
  ouvintes.forEach((o) => o());
}

export function alternarTema() {
  const tema: Tema = atual.tema === 'claro' ? 'escuro' : 'claro';
  // O tema fica no localStorage como texto puro, porque o index.html lê antes do React.
  try {
    localStorage.setItem('rabisco:tema', tema);
  } catch {
    // sem armazenamento: vale só nesta visita
  }
  document.documentElement.dataset.tema = tema;
  mudar({ tema });
}

export function alternarSom() {
  gravar('mudo', !atual.mudo);
  mudar({ mudo: !atual.mudo });
}

export function estaMudo() {
  return atual.mudo;
}

export function usePreferencias(): Preferencias {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o);
      return () => ouvintes.delete(o);
    },
    () => atual,
  );
}
