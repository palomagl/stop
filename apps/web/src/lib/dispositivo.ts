import { gravar, ler } from './armazenamento';

function novoId(): string {
  // randomUUID só existe em página segura (https ou localhost); no celular pela rede de casa, não.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

let cache: string | null = null;

/**
 * Identificador anônimo deste aparelho. Serve só para o histórico e o ranking:
 * não tem nome, e-mail nem nada da pessoa. Sem localStorage, vale só nesta visita.
 */
export function idDoDispositivo(): string {
  if (cache) return cache;
  const salvo = ler<string>('dispositivo');
  cache = salvo && /^[A-Za-z0-9-]{8,64}$/.test(salvo) ? salvo : novoId();
  if (cache !== salvo) gravar('dispositivo', cache);
  return cache;
}
