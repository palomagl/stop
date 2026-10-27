# Personagens (bichos)

Os 24 personagens que a pessoa escolhe ao entrar na sala. Eles aparecem na lista de jogadores, no progresso da rodada, ao lado de cada resposta na correção, no placar e no pódio.

## Onde ficam

`apps/web/public/bichos/`, **um arquivo por bicho**. O código só aponta para o nome do arquivo (lista em `apps/web/src/componentes/Avatar.tsx`). Para melhorar um desenho, basta **substituir o arquivo mantendo o mesmo nome**. Não precisa mexer em código.

| Nº | Arquivo | Bicho |
|---|---|---|
| 1 | `01-caramelo.svg` | Vira-lata caramelo |
| 2 | `02-gato.svg` | Gato cinza rajado |
| 3 | `03-capivara.svg` | Capivara |
| 4 | `04-onca.svg` | Onça-pintada |
| 5 | `05-tucano.svg` | Tucano |
| 6 | `06-arara.svg` | Arara-vermelha |
| 7 | `07-mico-leao.svg` | Mico-leão-dourado |
| 8 | `08-preguica.svg` | Bicho-preguiça |
| 9 | `09-lobo-guara.svg` | Lobo-guará |
| 10 | `10-boto.svg` | Boto-cor-de-rosa |
| 11 | `11-tatu.svg` | Tatu |
| 12 | `12-sapo.svg` | Sapo |
| 13 | `13-coruja.svg` | Coruja |
| 14 | `14-panda.svg` | Panda |
| 15 | `15-raposa.svg` | Raposa |
| 16 | `16-coelho.svg` | Coelho |
| 17 | `17-coala.svg` | Coala |
| 18 | `18-pinguim.svg` | Pinguim |
| 19 | `19-porquinho.svg` | Porquinho |
| 20 | `20-leao.svg` | Leão |
| 21 | `21-tigre.svg` | Tigre |
| 22 | `22-pintinho.svg` | Pintinho |
| 23 | `23-unicornio.svg` | Unicórnio |
| 24 | `24-dragao.svg` | Dragão |

## Regras para um desenho novo

- **Formato:** SVG (de preferência) ou PNG. Se trocar para PNG, use o mesmo nome com `.png` e ajuste a extensão em `Avatar.tsx`.
- **Quadrado:** `viewBox="0 0 100 100"` no SVG, ou pelo menos 512 × 512 px no PNG.
- **Fundo transparente.** O jogo coloca o quadradinho de fundo (azul-escuro, cantos redondos).
- **Enquadramento:** rosto de frente, cabeça e ombros, como numa foto 3×4. Os ombros encostam na borda de baixo; orelhas, chifres e topetes podem chegar perto da borda de cima.
- **Mesma família:** todos com o mesmo estilo de traço, iluminação (luz vindo de cima à esquerda) e olhos grandes e expressivos. Cada bicho precisa ser reconhecível em 32 px.
- **Originais:** não copiar personagens de outros jogos ou marcas.
- **Ordem:** a posição na lista é o número guardado no servidor. Bichos novos entram no fim, sem reordenar os que já existem. Se aumentar a quantidade, atualize `TOTAL_AVATARES` em `packages/shared/src/constantes.ts`.
