import { normalizar } from './normalizar';

/** Lista simples e curta. Serve para apelidos, não pretende ser um filtro completo. */
const PALAVRAS_INTEIRAS = [
  'cu', 'pau', 'rola', 'fdp', 'vsf', 'tnc', 'pqp', 'krl', 'puta', 'puto',
  'foda', 'fode', 'fuder', 'foder', 'merda', 'bosta', 'porra', 'cacete', 'caralho',
  'buceta', 'boceta', 'xota', 'xoxota', 'piroca', 'rabo', 'viado',
  'corno', 'corna', 'otario', 'otaria', 'babaca', 'idiota', 'imbecil',
  'arrombado', 'arrombada', 'vagabundo', 'vagabunda', 'vadia', 'punheta',
  'cuzao', 'escroto', 'escrota', 'desgraca', 'desgracado', 'desgracada', 'retardado',
];

/** Palavras longas o bastante para procurar no meio do texto ("XxPorraxX"). */
const TRECHOS = PALAVRAS_INTEIRAS.filter((p) => p.length >= 5);

export function contemPalavrao(texto: string): boolean {
  const limpo = normalizar(texto);
  const palavras = limpo.split(' ');
  const proibida = (p: string) => PALAVRAS_INTEIRAS.includes(p) || PALAVRAS_INTEIRAS.includes(p.replace(/s$/, ''));
  if (palavras.some(proibida)) return true;
  const grudado = limpo.replace(/ /g, '');
  return TRECHOS.some((trecho) => grudado.includes(trecho));
}
