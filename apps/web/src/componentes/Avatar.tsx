/**
 * Os personagens ficam em `public/bichos/`, um WebP transparente por bicho. Para trocar o desenho
 * de um deles, basta substituir o arquivo mantendo o nome (veja docs/personagens.md).
 * A ordem desta lista é o número que o servidor guarda, então bichos novos entram no fim.
 */
const TRADICIONAIS: { nome: string; arquivo: string }[] = [
  { nome: 'Caramelo', arquivo: '01-caramelo.webp' },
  { nome: 'Gato', arquivo: '02-gato.webp' },
  { nome: 'Capivara', arquivo: '03-capivara.webp' },
  { nome: 'Onça', arquivo: '04-onca.webp' },
  { nome: 'Tucano', arquivo: '05-tucano.webp' },
  { nome: 'Arara', arquivo: '06-arara.webp' },
  { nome: 'Mico-leão', arquivo: '07-mico-leao.webp' },
  { nome: 'Preguiça', arquivo: '08-preguica.webp' },
  { nome: 'Lobo-guará', arquivo: '09-lobo-guara.webp' },
  { nome: 'Boto', arquivo: '10-boto.webp' },
  { nome: 'Tatu', arquivo: '11-tatu.webp' },
  { nome: 'Sapo', arquivo: '12-sapo.webp' },
  { nome: 'Coruja', arquivo: '13-coruja.webp' },
  { nome: 'Panda', arquivo: '14-panda.webp' },
  { nome: 'Raposa', arquivo: '15-raposa.webp' },
  { nome: 'Coelho', arquivo: '16-coelho.webp' },
  { nome: 'Coala', arquivo: '17-coala.webp' },
  { nome: 'Pinguim', arquivo: '18-pinguim.webp' },
  { nome: 'Porquinho', arquivo: '19-porquinho.webp' },
  { nome: 'Leão', arquivo: '20-leao.webp' },
  { nome: 'Tigre', arquivo: '21-tigre.webp' },
  { nome: 'Pintinho', arquivo: '22-pintinho.webp' },
  { nome: 'Unicórnio', arquivo: '23-unicornio.webp' },
  { nome: 'Dragão', arquivo: '24-dragao.webp' },
];

export type ColecaoAvatar = 'divertidos' | 'tradicionais' | 'extras';

const EXTRAS = [
  { nome: 'Urso', arquivo: 'engracados/25-urso.webp' },
  { nome: 'Alce', arquivo: 'engracados/26-alce.webp' },
  { nome: 'Cachorro', arquivo: 'engracados/27-cachorro.webp' },
  { nome: 'Gato brincalhão', arquivo: 'engracados/28-gato.webp' },
  { nome: 'Ratinho', arquivo: 'engracados/29-ratinho.webp' },
  { nome: 'Coelho dentuço', arquivo: 'engracados/30-coelho.webp' },
  { nome: 'Raposa sorridente', arquivo: 'engracados/31-raposa.webp' },
  { nome: 'Lobo bagunceiro', arquivo: 'engracados/32-lobo.webp' },
  { nome: 'Guaxinim', arquivo: 'engracados/33-guaxinim.webp' },
  { nome: 'Cachorrinho', arquivo: 'engracados/34-cachorrinho.webp' },
  { nome: 'Sapo bocão', arquivo: 'engracados/35-sapo.webp' },
  { nome: 'Coruja curiosa', arquivo: 'engracados/36-coruja.webp' },
  { nome: 'Pintinho sapeca', arquivo: 'engracados/37-pintinho.webp' },
  { nome: 'Papagaio', arquivo: 'engracados/38-papagaio.webp' },
  { nome: 'Pinguim divertido', arquivo: 'engracados/39-pinguim.webp' },
  { nome: 'Urso-polar', arquivo: 'engracados/40-urso-polar.webp' },
  { nome: 'Pato', arquivo: 'engracados/41-pato.webp' },
  { nome: 'Cabritinho', arquivo: 'engracados/42-cabritinho.webp' },
  { nome: 'Tigre risonho', arquivo: 'engracados/43-tigre.webp' },
  { nome: 'Coala sonolento', arquivo: 'engracados/44-coala.webp' },
  { nome: 'Cervo', arquivo: 'engracados/45-cervo.webp' },
  { nome: 'Cavalo', arquivo: 'engracados/46-cavalo.webp' },
  { nome: 'Unicórnio mágico', arquivo: 'engracados/47-unicornio.webp' },
  { nome: 'Dragão brincalhão', arquivo: 'engracados/48-dragao.webp' },
  { nome: 'Diabinho', arquivo: 'engracados/49-diabinho.webp' },
  { nome: 'Sereia', arquivo: 'engracados/50-sereia.webp' },
  { nome: 'Cérebro', arquivo: 'engracados/51-cerebro.webp' },
  { nome: 'Monstrinho', arquivo: 'engracados/52-monstrinho.webp' },
  { nome: 'Caveirinha', arquivo: 'engracados/53-caveira.webp' },
  { nome: 'Planeta', arquivo: 'engracados/54-planeta.webp' },
];

// Os IDs antigos permanecem: tradicionais 0–23, extras 24–53, divertidos 54–83.
// Os Divertidos vêm com o cartão roxo desenhado; o recorte sem fundo é o que aparece no pódio.
const DIVERTIDOS = EXTRAS.map((avatar, indice) => ({
  nome: avatar.nome,
  arquivo: `divertidos/${String(indice + 55).padStart(2, '0')}.webp`,
  recorte: `divertidos/recorte/${String(indice + 55).padStart(2, '0')}.webp`,
}));

export const COLECOES: { id: ColecaoAvatar; nome: string; descricao: string }[] = [
  { id: 'divertidos', nome: 'Divertidos', descricao: 'Carinhas e caretas' },
  { id: 'tradicionais', nome: 'Tradicionais', descricao: 'Os bichos da turma' },
  { id: 'extras', nome: 'Extras', descricao: 'Mais personalidades' },
];

export const AVATARES = [
  ...TRADICIONAIS.map((avatar) => ({ ...avatar, colecao: 'tradicionais' as const })),
  ...EXTRAS.map((avatar) => ({ ...avatar, colecao: 'extras' as const })),
  ...DIVERTIDOS.map((avatar) => ({ ...avatar, colecao: 'divertidos' as const })),
];

function avatarPorId(id: number) {
  return AVATARES[id] ?? AVATARES[0]!;
}

export function urlDoAvatar(id: number): string {
  return `/bichos/${avatarPorId(id).arquivo}`;
}

/** O bicho sem fundo nenhum, para quem desenha em volta dele (como o pódio). */
export function recorteDoAvatar(id: number): string {
  const avatar = avatarPorId(id);
  return `/bichos/${'recorte' in avatar ? avatar.recorte : avatar.arquivo}`;
}

export function nomeDoAvatar(id: number): string {
  return avatarPorId(id).nome;
}

/** O bicho num quadradinho de cantos redondos, com fundo escuro para as cores saltarem. */
export function Avatar({ id, tamanho = 40, className = '' }: { id: number; tamanho?: number; className?: string }) {
  const avatar = avatarPorId(id);
  return (
    <img
      src={urlDoAvatar(id)}
      alt={avatar.nome}
      width={tamanho}
      height={tamanho}
      draggable={false}
      className={`avatar inline-block shrink-0 rounded-[22%] ${className}`}
    />
  );
}
