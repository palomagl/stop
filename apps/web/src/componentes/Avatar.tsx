/**
 * Os personagens ficam em `public/bichos/`, um SVG por bicho. Para trocar o desenho
 * de um deles, basta substituir o arquivo mantendo o nome (veja docs/personagens.md).
 * A ordem desta lista é o número que o servidor guarda, então bichos novos entram no fim.
 */
export const AVATARES: { nome: string; arquivo: string }[] = [
  { nome: 'Caramelo', arquivo: '01-caramelo.svg' },
  { nome: 'Gato', arquivo: '02-gato.svg' },
  { nome: 'Capivara', arquivo: '03-capivara.svg' },
  { nome: 'Onça', arquivo: '04-onca.svg' },
  { nome: 'Tucano', arquivo: '05-tucano.svg' },
  { nome: 'Arara', arquivo: '06-arara.svg' },
  { nome: 'Mico-leão', arquivo: '07-mico-leao.svg' },
  { nome: 'Preguiça', arquivo: '08-preguica.svg' },
  { nome: 'Lobo-guará', arquivo: '09-lobo-guara.svg' },
  { nome: 'Boto', arquivo: '10-boto.svg' },
  { nome: 'Tatu', arquivo: '11-tatu.svg' },
  { nome: 'Sapo', arquivo: '12-sapo.svg' },
  { nome: 'Coruja', arquivo: '13-coruja.svg' },
  { nome: 'Panda', arquivo: '14-panda.svg' },
  { nome: 'Raposa', arquivo: '15-raposa.svg' },
  { nome: 'Coelho', arquivo: '16-coelho.svg' },
  { nome: 'Coala', arquivo: '17-coala.svg' },
  { nome: 'Pinguim', arquivo: '18-pinguim.svg' },
  { nome: 'Porquinho', arquivo: '19-porquinho.svg' },
  { nome: 'Leão', arquivo: '20-leao.svg' },
  { nome: 'Tigre', arquivo: '21-tigre.svg' },
  { nome: 'Pintinho', arquivo: '22-pintinho.svg' },
  { nome: 'Unicórnio', arquivo: '23-unicornio.svg' },
  { nome: 'Dragão', arquivo: '24-dragao.svg' },
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
