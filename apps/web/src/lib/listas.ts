import { useSyncExternalStore } from 'react';
import { configSchema, type Config } from '@rabisco/shared';
import { gravar, ler } from './armazenamento';

export interface ListaSalva {
  nome: string;
  categorias: string[];
}

export const MAX_LISTAS = 10;

/**
 * Listas de categorias salvas neste aparelho. Ficam no localStorage de propósito:
 * funcionam sem conta e sem banco, e cada pessoa tem as suas.
 */
let listas: ListaSalva[] = (ler<ListaSalva[]>('listas') ?? []).filter(
  (l) => typeof l?.nome === 'string' && Array.isArray(l.categorias),
);
const ouvintes = new Set<() => void>();

function mudar(novas: ListaSalva[]) {
  listas = novas;
  gravar('listas', listas);
  ouvintes.forEach((o) => o());
}

export function salvarLista(nome: string, categorias: string[]) {
  const outras = listas.filter((l) => l.nome !== nome);
  mudar([{ nome, categorias: [...categorias] }, ...outras].slice(0, MAX_LISTAS));
}

export function apagarLista(nome: string) {
  mudar(listas.filter((l) => l.nome !== nome));
}

export function useListas(): ListaSalva[] {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o);
      return () => ouvintes.delete(o);
    },
    () => listas,
  );
}

/** Regras da última sala que a pessoa configurou, para a próxima sala já nascer igual. */
export function lembrarConfig(config: Config) {
  gravar('ultimaConfig', config);
}

export function ultimaConfig(): Config | null {
  const r = configSchema.safeParse(ler('ultimaConfig'));
  return r.success ? r.data : null;
}
