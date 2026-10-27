/**
 * localStorage pode não existir ou dar erro (aba anônima, dados bloqueados).
 * Tudo passa por aqui, e o jogo funciona mesmo sem ele.
 */
export function ler<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(`stopou:${chave}`);
    return bruto === null ? null : (JSON.parse(bruto) as T);
  } catch {
    return null;
  }
}

export function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(`stopou:${chave}`, JSON.stringify(valor));
  } catch {
    // sem armazenamento: segue sem lembrar
  }
}

export function apagar(chave: string): void {
  try {
    localStorage.removeItem(`stopou:${chave}`);
  } catch {
    // idem
  }
}
