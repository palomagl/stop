# Personagens (bichos)

Os 24 personagens que a pessoa escolhe ao entrar na sala. Eles aparecem na lista de jogadores, no progresso da rodada, ao lado de cada resposta na correção, no placar e no pódio.

## Onde ficam

`apps/web/public/bichos/`, **um WebP transparente por bicho**. O código só aponta para o nome do arquivo (lista em `apps/web/src/componentes/Avatar.tsx`). Para melhorar um desenho, basta **substituir o arquivo mantendo o mesmo nome**. Não precisa mexer em código.

| Nº | Arquivo | Bicho |
|---|---|---|
| 1 | `01-caramelo.webp` | Vira-lata caramelo |
| 2 | `02-gato.webp` | Gato cinza rajado |
| 3 | `03-capivara.webp` | Capivara |
| 4 | `04-onca.webp` | Onça-pintada |
| 5 | `05-tucano.webp` | Tucano |
| 6 | `06-arara.webp` | Arara-vermelha |
| 7 | `07-mico-leao.webp` | Mico-leão-dourado |
| 8 | `08-preguica.webp` | Bicho-preguiça |
| 9 | `09-lobo-guara.webp` | Lobo-guará |
| 10 | `10-boto.webp` | Boto-cor-de-rosa |
| 11 | `11-tatu.webp` | Tatu |
| 12 | `12-sapo.webp` | Sapo |
| 13 | `13-coruja.webp` | Coruja |
| 14 | `14-panda.webp` | Panda |
| 15 | `15-raposa.webp` | Raposa |
| 16 | `16-coelho.webp` | Coelho |
| 17 | `17-coala.webp` | Coala |
| 18 | `18-pinguim.webp` | Pinguim |
| 19 | `19-porquinho.webp` | Porquinho |
| 20 | `20-leao.webp` | Leão |
| 21 | `21-tigre.webp` | Tigre |
| 22 | `22-pintinho.webp` | Pintinho |
| 23 | `23-unicornio.webp` | Unicórnio |
| 24 | `24-dragao.webp` | Dragão |

Os WebP atuais têm 256 × 256 px, com margem transparente, traço cartoon 2D, formas arredondadas, olhos expressivos e sombras simples, sem textura realista de pelos. Os SVG anteriores continuam na pasta como referência; o jogo usa os WebP. A ordem e os identificadores dos personagens foram preservados.

## Regras para um desenho novo

- **Formato:** WebP com transparência. SVG e PNG também são aceitos; ao mudar o formato, ajuste a extensão em `Avatar.tsx`.
- **Quadrado:** `viewBox="0 0 100 100"` no SVG, ou pelo menos 256 × 256 px nos formatos raster (512 × 512 px para novos desenhos, se disponível).
- **Fundo transparente.** O jogo coloca o quadradinho de fundo (azul-escuro, cantos redondos).
- **Enquadramento:** rosto de frente, cabeça e ombros, como numa foto 3×4. Os ombros encostam na borda de baixo; orelhas, chifres e topetes podem chegar perto da borda de cima.
- **Mesma família:** todos com o mesmo estilo de traço, iluminação (luz vindo de cima à esquerda) e olhos grandes e expressivos. Cada bicho precisa ser reconhecível em 32 px.
- **Originais:** não copiar personagens de outros jogos ou marcas.
- **Ordem:** a posição na lista é o número guardado no servidor. Bichos novos entram no fim, sem reordenar os que já existem. Se aumentar a quantidade, atualize `TOTAL_AVATARES` em `packages/shared/src/constantes.ts`.
