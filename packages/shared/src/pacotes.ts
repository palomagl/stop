import { CATEGORIAS_PADRAO } from './constantes';
import { normalizar } from './normalizar';

export interface PacoteDeCategorias {
  id: string;
  emoji: string;
  nome: string;
  descricao: string;
  categorias: string[];
}

/** Pacotes prontos que quem é dono da sala aplica com um toque. */
export const PACOTES: PacoteDeCategorias[] = [
  {
    id: 'classico',
    emoji: '📒',
    nome: 'Clássico',
    descricao: 'As 12 de sempre',
    categorias: [...CATEGORIAS_PADRAO],
  },
  {
    id: 'rapidinho',
    emoji: '⚡',
    nome: 'Rapidinho',
    descricao: '5 categorias, rodada curta',
    categorias: ['Nome', 'Animal', 'Cor', 'Fruta/Verdura/Legume', 'Objeto'],
  },
  {
    id: 'comilanca',
    emoji: '🍕',
    nome: 'Comilança',
    descricao: 'Só coisa gostosa',
    categorias: ['Comida', 'Doce', 'Bebida', 'Fruta/Verdura/Legume', 'Tempero', 'Prato típico'],
  },
  {
    id: 'cultura-pop',
    emoji: '🎬',
    nome: 'Cultura pop',
    descricao: 'Filmes, séries, música',
    categorias: ['Filme', 'Série', 'Desenho', 'Música', 'Cantor/Banda', 'Personagem', 'Celebridade', 'Jogo'],
  },
  {
    id: 'brasileirao',
    emoji: '🇧🇷',
    nome: 'Brasileirão',
    descricao: 'Bem brasileiro',
    categorias: [
      'Cidade do Brasil',
      'Estado',
      'Time de futebol',
      'Comida típica',
      'Cantor/Banda',
      'Novela',
      'Gíria',
      'Ponto turístico',
    ],
  },
  {
    id: 'escola',
    emoji: '🎒',
    nome: 'Escola',
    descricao: 'Para treinar a cabeça',
    categorias: ['Nome', 'País', 'Capital', 'Animal', 'Profissão', 'Objeto', 'Verbo', 'Adjetivo'],
  },
  {
    id: 'volta-ao-mundo',
    emoji: '🌎',
    nome: 'Volta ao mundo',
    descricao: 'Países, cidades e viagens',
    categorias: ['País', 'Capital', 'Cidade', 'Idioma', 'Meio de transporte', 'Ponto turístico'],
  },
];

/** O pacote que tem exatamente essas categorias (em qualquer ordem), se houver. */
export function pacoteDasCategorias(categorias: string[]): PacoteDeCategorias | undefined {
  const chave = (lista: string[]) => lista.map(normalizar).sort().join('|');
  const procurada = chave(categorias);
  return PACOTES.find((p) => chave(p.categorias) === procurada);
}
