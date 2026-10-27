/** Junta espaços repetidos e tira os das pontas. É assim que a resposta é guardada. */
export function limparTexto(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Minúsculas, sem acento, sem pontuação e com um espaço só entre as palavras. */
export function normalizar(texto: string): string {
  return semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function singular(palavra: string): string {
  return palavra.length > 3 && palavra.endsWith('s') ? palavra.slice(0, -1) : palavra;
}

/**
 * Chave usada para saber se duas respostas são "a mesma".
 * Ignora maiúsculas, acentos, espaços extras e plural simples: "Abacaxi" = "abacaxis".
 */
export function chaveResposta(texto: string): string {
  return normalizar(texto).split(' ').filter(Boolean).map(singular).join(' ');
}
