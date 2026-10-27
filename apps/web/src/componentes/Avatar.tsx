/**
 * Os personagens ficam em `public/bichos/`, um WebP transparente por bicho. Para trocar o desenho
 * de um deles, basta substituir o arquivo mantendo o nome (veja docs/personagens.md).
 * A ordem desta lista é o número que o servidor guarda, então bichos novos entram no fim.
 */
export const AVATARES: { nome: string; arquivo: string }[] = [
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

/** O bicho num quadradinho de cantos redondos, com fundo escuro para as cores saltarem. */
export function Avatar({ id, tamanho = 40, className = '' }: { id: number; tamanho?: number; className?: string }) {
  const avatar = AVATARES[id] ?? AVATARES[0]!;
  return (
    <img
      src={`/bichos/${avatar.arquivo}`}
      alt={avatar.nome}
      width={tamanho}
      height={tamanho}
      draggable={false}
      className={`inline-block shrink-0 rounded-[22%] bg-[#1d2a63] ${className}`}
    />
  );
}
