# Stopou! · detalhes técnicos

Como o jogo funciona por dentro, como rodar no seu computador e como publicar. Para só jogar: [jogostop-rabisco.vercel.app](https://jogostop-rabisco.vercel.app).

## Stack

| Parte | Tecnologias |
|---|---|
| `apps/web` | React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion |
| `apps/server` | Node.js, TypeScript, Socket.IO, Postgres (`pg`) |
| `packages/shared` | Tipos, nomes dos eventos, schemas Zod e regras de pontuação, usados pelos dois lados |
| Banco | Postgres no Neon (grátis); nos testes, PGlite (Postgres em WebAssembly) |
| App | PWA com `vite-plugin-pwa` |
| Testes | Vitest (unidade e integração) e Playwright (ponta a ponta) |
| CI | GitHub Actions: lint, checagem de tipos, testes e build a cada push |

## Arquitetura

```
apps/
  web/                 o que roda no navegador
    src/telas/         Inicio, Lobby, Sorteio, Respostas, Correcao, Resultado, Fim
    src/componentes/   Logo, Avatar, Cronometro, Carimbo, Reacoes, Confete…
    src/lib/           conexão com o servidor, relógio, sons, preferências
  server/              o juiz da partida
    src/jogo/          Sala (máquina de estados) e GerenciadorDeSalas
    src/socket/        eventos do Socket.IO, rotas HTTP, validação e limite de eventos
    src/arquivo/       partidas terminadas: Postgres ou memória
    src/robos/         robôs: plano de jogo, controle por sala, Gemini e listas de palavras
packages/
  shared/              regras que os dois lados precisam conhecer
e2e/                   testes com dois navegadores
```

### Máquina de estados da partida

```mermaid
stateDiagram-v2
    direction LR
    [*] --> lobby
    lobby --> sorteio: dono inicia<br/>(todos prontos)
    sorteio --> respostas: letra sorteada
    respostas --> travando: STOP com tudo preenchido
    respostas --> correcao: tempo acabou
    travando --> correcao: depois de 3 s
    correcao --> correcao: próxima categoria<br/>(todos prontos ou 30 s)
    correcao --> resultado: última categoria
    resultado --> sorteio: ainda tem rodada
    resultado --> fim: última rodada
    fim --> sorteio: jogar de novo
    fim --> lobby: mudar as regras
```

Se, no meio da partida, sobrar só uma pessoa na sala, a partida vai direto para o `fim`.

### Eventos

O servidor sempre manda o **retrato completo da sala** (`sala:estado`), já filtrado para cada pessoa: durante a rodada ninguém recebe as respostas dos outros, só quantos campos cada um preencheu. Os eventos avulsos existem só para animações.

| Navegador → servidor | Servidor → navegador |
|---|---|
| `sala:criar`, `sala:entrar`, `sala:reconectar` (com confirmação) | `sala:estado`: retrato completo |
| `sala:sair`, `sala:configurar`, `sala:remover`, `jogador:pronto` | `sala:erro`: mensagem para mostrar |
| `partida:iniciar`, `partida:jogarDeNovo` | `rodada:stop`: quem apertou, para o apito |
| `resposta:rascunho`, `rodada:stop`, `rodada:pularLetra` | `reacao`: emoji flutuante |
| `voto:enviar`, `correcao:pronto`, `resultado:pronto`, `reacao:enviar` | `jogador:removido` |
| `sala:jogarAgora` (com confirmação), `jogador:denunciar`, `sala:adicionarRobo` | |

Fora do Socket.IO, há três rotas HTTP:

| Rota | O que devolve |
|---|---|
| `GET /health` | se o servidor está de pé, se tem banco ligado e se os robôs estão pensando com IA |
| `GET /ranking?dispositivo=…` | os 20 primeiros do ranking; a pessoa que pergunta vem marcada com `eu` |
| `GET /historico?dispositivo=…` | as últimas 30 partidas daquele aparelho |

## Decisões

### Por que o servidor manda no jogo

Se o navegador sorteasse a letra, contasse o tempo ou somasse os pontos, bastaria abrir o console para trapacear, e duas telas poderiam discordar sobre quem parou primeiro. Por isso o navegador só **mostra o estado e manda intenções** ("quero parar", "voto 👎 nisso"). O servidor confere tudo:

- todo evento passa por um **schema Zod** (o mesmo que o navegador usa para mostrar erros antes de enviar);
- ação fora da hora é **ignorada**: resposta depois do fechamento, voto em categoria que já passou, voto na própria resposta;
- o STOP só vale se o servidor confirmar que **todos** os campos de quem apertou estão preenchidos;
- cada conexão tem um **limite de eventos** (balde de fichas), e pacotes grandes são recusados na entrada.

**O cronômetro usa o relógio do servidor.** O servidor manda o horário em que a fase termina e o horário em que montou o retrato. O navegador calcula a diferença entre os dois relógios e só desenha a contagem. Assim, quem tem internet mais lenta não ganha segundos extras, e todo mundo vê o tempo zerar junto. Depois do fim do tempo, o servidor espera mais 0,8 s antes de fechar a rodada, para os últimos rascunhos chegarem.

### Como a reconexão funciona

1. Ao entrar numa sala, o servidor devolve um **token** aleatório que o navegador guarda no `localStorage` (sempre dentro de `try/catch`, porque em aba anônima ele pode falhar).
2. As respostas vão para o servidor **enquanto a pessoa digita** (250 ms depois da última tecla, e na hora quando ela sai do campo ou aperta STOP).
3. Se a conexão cai, o Socket.IO tenta voltar sozinho. Ao reconectar, ou ao atualizar a página, o navegador manda `sala:reconectar` com o token, e o servidor devolve o retrato completo, com as respostas daquela pessoa.
4. Quem fica **mais de 2 minutos fora** no meio da partida sai dela, e o jogo continua sem a pessoa. No lobby, ela continua na sala, mas, se for dona, a posição passa para alguém online. Quem estava esperando a pessoa apertar "pronto" na correção não fica preso: quem está offline não entra na conta.
5. Salas sem ninguém conectado por 30 minutos são apagadas da memória.

### Como o jogo sabe se a resposta vale

O jogo não tem um dicionário que saiba se "Urso" é mesmo um animal ou se "Uberlândia" é uma cidade, e isso é de propósito: é assim também no Stop de papel. A conferência tem duas partes:

1. **O que dá para checar sozinho, o servidor anula na hora:** resposta em branco, que não começa com a letra sorteada, ou que é só a letra.
2. **O resto quem decide são as pessoas:** na correção, cada um vota 👍 ou 👎 nas respostas dos outros (na própria não dá). A maioria de 👎 anula; empate mantém. Com duas pessoas, um 👎 já basta.

Uma lista de palavras por categoria poderia sugerir votos ("essa palavra não está na lista de frutas"), mas nunca decidir sozinha: as categorias são livres (dá para criar "Time de futebol" ou "MSÉ") e a graça do jogo está na discussão.

### Como as respostas são comparadas

`chaveResposta()` em `packages/shared/src/normalizar.ts` transforma cada resposta numa chave:

1. tira os acentos (`normalize('NFD')` e remove as marcas);
2. passa para minúsculas e troca pontuação por espaço;
3. junta espaços repetidos;
4. tira o **plural simples**: o "s" final de palavras com mais de 3 letras.

Assim, `"Abacaxi"`, `"abacaxis"` e `"ABACAXÍ"` viram a mesma resposta e valem 5 pontos cada. Palavras curtas como "gás" ficam como estão. Plurais irregulares ("pães" e "pão") não são tratados de propósito: a correção por votos resolve os casos estranhos melhor do que uma regra cheia de exceções.

A mesma função roda nos dois lados: o servidor usa para pontuar, e o navegador usa para mostrar na correção a prévia "vale 10" ou "vale 5".

### Histórico e ranking sem cadastro

Para jogar entre amigos, criar conta seria só atrito. Então cada aparelho ganha um **identificador anônimo** (um UUID guardado no `localStorage`), que vai junto ao entrar numa sala. Quando a partida termina com pelo menos uma rodada completa, o servidor guarda quem jogou, os pontos e a posição.

- **Privacidade:** o identificador nunca sai do servidor. O ranking só devolve apelido, avatar, números e a marca `eu` para quem perguntou. Sem isso, qualquer pessoa poderia pegar o identificador de outra e ler o histórico dela.
- **O ranking agrupa por aparelho** e mostra o apelido mais recente. Quem troca de apelido continua com as mesmas vitórias.
- **Limites conhecidos:** limpar os dados do navegador ou trocar de celular começa um histórico novo, e dá para "inflar" o ranking jogando contra si mesmo em duas abas. Para um jogo entre amigos, é uma troca justa. Com contas de verdade, isso mudaria.
- **A gravação é um comando SQL só** (um `INSERT` com CTE), então a partida e as participações entram juntas ou nada entra, sem depender de transação numa conexão específica do pool.
- **Sem `DATABASE_URL`,** o servidor funciona normalmente e só desliga o histórico e o ranking. O site avisa isso, em vez de mostrar uma lista vazia.

### Listas de categorias no aparelho

As listas salvas ficam no `localStorage` de quem é dono da sala, e não no banco. Elas funcionam sem cadastro e sem servidor, e cada pessoa tem as suas. A troca é que elas não acompanham você para outro celular.

### Pular letra

Letra difícil (tipo Y numa sala sem K, W, Y e X excluídos) acontece. Durante as respostas, cada pessoa pode votar para pular; com a **maioria de quem está jogando a rodada** (as duas, se forem só duas), o servidor sorteia outra letra e a rodada recomeça com tempo cheio e campos vazios. Vale **uma vez por partida**, só antes do STOP, e só se sobrar letra para as próximas rodadas. A letra pulada não volta.

### Folha da rodada e pódio

No fim de cada rodada o servidor manda, além do placar, a **folha**: cada categoria com a resposta de cada pessoa, os pontos e se foi anulada. No fim da partida o pódio aparece com suspense (rufar de tambor, depois 3º, 2º e 1º, cada bicho caindo no seu degrau); dá para pular, e quem desativou animações vê tudo de uma vez.

### Robôs

Dá para jogar sozinho ou completar a turma com robôs fáceis, médios ou difíceis (até 5 por sala). O robô é um jogador de verdade dentro da sala: ele olha o mesmo retrato que uma pessoa recebe e age pelos mesmos caminhos (rascunho, STOP, voto e "Pronto"), então a regra do jogo vale igual para todo mundo.

- **Joga no tempo de gente.** Cada resposta leva o tempo de lembrar a palavra (2 a 11 segundos, conforme o nível) mais o de digitar letra por letra no celular. Ideia rara demora mais para vir. Ele vai mais ou menos na ordem das categorias, às vezes pula uma e volta, trava em algumas e deixa em branco. Quem joga vê o progresso dele subir aos poucos. Só aperta STOP quando preencheu tudo, depois de conferir.
- **Nível muda o jeito de jogar.** O fácil vai no óbvio (e repete com os outros, valendo 5), trava mais e às vezes escreve algo de outra categoria. O difícil foge da primeira ideia para fazer resposta única e quase nunca trava.
- **Vota com cuidado.** Só anula o que acha que não vale; quando não sabe, não vota. Robô não vota para pular letra, não pode ser denunciado e não segura a sala: sem nenhuma pessoa, a sala fecha. Se todo mundo já apertou "Pronto", os robôs se apressam.
- **De onde vêm as ideias.** Com `GEMINI_API_KEY`, o servidor pede ao Gemini, no sorteio da letra, até 6 respostas por categoria, da mais comum para a mais rara, em JSON com formato obrigatório (`responseSchema`). Na correção, um segundo pedido julga de uma vez o que as pessoas escreveram. Se um modelo estiver lotado ou sem cota, tenta o próximo (`gemini-3.5-flash-lite` → `gemini-3.5-flash`), como no Ritmo. Os pedidos são guardados por letra e categorias, ficam limitados a 12 por minuto, e sem cota o servidor descansa um minuto. Sem chave, ou se tudo falhar, o robô usa as listas de palavras do próprio jogo (`apps/server/src/robos/palavras.ts`), que cobrem as categorias de sempre.
- **A chave fica só no servidor.** Quem chama a IA é o servidor, não o navegador, então a chave nunca vai para o site.
- **Partida contra robô é treino:** aparece em "Minhas partidas", mas não conta no ranking.

### Denúncia de apelido

Nas salas públicas ("Jogar agora") aparece gente desconhecida, então cada pessoa pode tocar na 🚩 ao lado de outra, na sala de espera ou na correção. Quem recebe denúncia da **maioria das outras pessoas da sala, e de pelo menos duas**, sai da sala e vê o motivo na tela. Cada pessoa denuncia uma vez, a própria pessoa não conta, e as denúncias de quem sai da sala deixam de valer. Nas salas particulares a bandeira não aparece, porque quem é dono já pode remover alguém. Cada denúncia fica registrada no log do servidor.

### Prévia do link e vibração

- O `index.html` tem as etiquetas Open Graph que o WhatsApp lê. A imagem (`public/og-stopou.jpg`, 1200 × 630) precisa de endereço completo: na Vercel ele vem sozinho de `VERCEL_PROJECT_PRODUCTION_URL`; em outra hospedagem, defina `VITE_SITE_URL`.
- O celular vibra quando alguém aperta STOP, no "3, 2, 1", quando faltam 10 segundos e quando o tempo acaba. Só funciona no Android: o iPhone não deixa sites vibrarem.

### O que mudaria com mais de um servidor

Hoje as salas vivem na memória de um único processo, e isso basta para o tamanho do jogo. Para rodar em várias instâncias:

- **Estado das salas** iria para o Redis (ou outro armazenamento compartilhado), e não mais para um `Map` local.
- **Cronômetros:** cada sala precisa de um "dono" que agenda as transições. Daria para usar *sticky sessions* por código de sala, para que todos os jogadores de uma sala caiam na mesma instância, ou uma fila de tarefas com horário (como BullMQ) para os prazos.
- **Mensagens** entre instâncias passariam pelo `@socket.io/redis-adapter`, para que um `io.to(sala)` chegue a quem está conectado em outra máquina.
- **Reconexão** já funciona por token, então sobrevive a trocar de instância, desde que o estado esteja no Redis.

## Rodando localmente

Precisa de Node.js 20 ou mais novo.

```bash
npm install
npm run dev
```

- Site: http://localhost:5173
- Servidor: http://localhost:3333 (`/health` mostra se está de pé)

Para testar no celular na mesma rede Wi-Fi, abra `http://IP-DO-COMPUTADOR:5173` e crie um `apps/web/.env.local` com `VITE_SERVER_URL=http://IP-DO-COMPUTADOR:3333`.

Para ligar o histórico e o ranking localmente, aponte o servidor para um Postgres (as tabelas são criadas sozinhas):

```bash
DATABASE_URL=postgres://usuario:senha@localhost:5432/stopou npm run dev
```

### Testes

```bash
npm test            # unidade e integração (Vitest)
npm run test:e2e    # dois navegadores jogando uma rodada (Playwright)
npm run lint
npm run typecheck
```

- **Unidade:** pontuação (única, repetida, anulada), comparação sem acento e plural, validação da letra, schemas e todas as transições da máquina de estados, com relógio falso.
- **Arquivo de partidas:** os mesmos testes rodam contra a versão em memória e contra um Postgres de verdade (PGlite), incluindo a ordem do ranking e do histórico.
- **Integração:** servidor de verdade e 3 clientes Socket.IO jogando uma rodada inteira, com alguém que cai e volta. Também o "Jogar agora" e uma partida que termina e aparece no ranking e no histórico.
- **Ponta a ponta:** dois navegadores criam e entram na sala, jogam uma rodada (um deles atualiza a página no meio) e chegam ao placar e ao pódio. Também: "Jogar agora" juntando duas pessoas, listas salvas e regras lembradas, e o aviso de ranking sem banco.

## Hospedando de graça

### 1. Banco no Neon (para histórico e ranking)

1. Em [neon.tech](https://neon.tech), crie uma conta e um projeto. Escolha a região mais perto do servidor: `AWS US East (N. Virginia)`, a mesma do Render.
2. Copie a **connection string** (começa com `postgresql://` e termina com `?sslmode=require`).

As tabelas são criadas sozinhas na primeira vez que o servidor liga. Se pular este passo, o jogo funciona igual, só sem histórico e ranking.

### 2. Servidor no Render

1. Em [render.com](https://render.com), crie uma conta e escolha **New → Blueprint**.
2. Selecione este repositório. O `render.yaml` já define tudo (Node 22, build, start e `/health`).
3. Em `DATABASE_URL`, cole a connection string do Neon. Deixe `ORIGENS_PERMITIDAS` vazio por enquanto.
4. Anote a URL gerada, por exemplo `https://stopou-servidor.onrender.com`. Abrindo `/health` nela, deve aparecer `"banco":true`.
5. Para os robôs pensarem com IA (opcional): crie uma chave grátis em [aistudio.google.com](https://aistudio.google.com) (**Get API key**), de preferência num projeto só do Stopou!, porque a cota grátis é por projeto. Cole em `GEMINI_API_KEY`. No `/health` deve aparecer `"robos":{"ia":true,…}`. Para trocar de modelo, use `GEMINI_MODELO`.

> O plano grátis do Render **dorme depois de ~15 minutos sem uso**, e a primeira visita depois disso leva até um minuto. O site mostra a tela "Acordando o servidor…" enquanto isso. Quando ele dorme, as salas abertas somem (as partidas terminadas continuam no Neon).

### 3. Site na Vercel

1. Em [vercel.com](https://vercel.com), escolha **Add New → Project** e importe o repositório.
2. Em **Root Directory**, escolha `apps/web`. A Vercel reconhece o Vite e os workspaces do npm.
3. Em **Environment Variables**, crie `VITE_SERVER_URL` com a URL do Render.
4. Faça o deploy e anote o endereço, por exemplo `https://stopou.vercel.app`.

### 4. Fechando o CORS

Volte ao Render e preencha `ORIGENS_PERMITIDAS` com o endereço da Vercel. Dá para colocar vários, separados por vírgula. Assim, só o seu site consegue conectar ao servidor.

### Deu problema?

| O que aparece | O que fazer |
|---|---|
| **"Falta ligar o servidor"** | O site foi publicado sem `VITE_SERVER_URL`. Na Vercel: **Settings → Environment Variables**, crie `VITE_SERVER_URL` com o endereço do Render (`https://…onrender.com`, sem barra no fim) e faça **Redeploy**. A variável entra no site na hora do build, por isso precisa publicar de novo. |
| **"Acordando o servidor…"** por até um minuto | Normal no plano grátis: o servidor estava dormindo. |
| **"O servidor não respondeu"** | Abra `https://…onrender.com/health` no navegador. Se não abrir, veja os logs do serviço no Render. Se abrir, confira se o endereço do site está em `ORIGENS_PERMITIDAS` (com `https://`, sem barra no fim). |
| Ranking diz que o servidor não guarda partidas | Falta `DATABASE_URL` no Render (passo 1). |
| Robô só responde coisas básicas | Sem `GEMINI_API_KEY`, ele usa a lista de palavras do jogo. Com a chave, o `ultimoErro` em `/health` mostra por que a IA falhou (chave errada, sem cota…). |

## Fases

- **Fase 1:** salas por código, partida completa em tempo real, reconexão, visual, sons, acessibilidade, testes e CI.
- **Fase 2:** salas públicas com "Jogar agora", listas de categorias salvas, histórico e ranking com Postgres, e instalação como app.
- **Fase 3:** robôs com IA (Gemini) que jogam no tempo de gente, em três níveis.

Ideias para depois: contas opcionais para levar o histórico entre aparelhos, moderação de salas públicas (denunciar apelido) e um modo "revanche" com placar acumulado entre partidas.

## Originalidade

Nome, logo, avatares, textos, sons e visual foram feitos para este projeto. Os sons são gerados por código com Web Audio. Só as regras clássicas da adedonha são as de sempre.
