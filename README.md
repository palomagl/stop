<p align="center">
  <img src="docs/icone.png" width="112" alt="" />
</p>

<h1 align="center">Stopou!</h1>

<p align="center">
  A adedonha online, em tempo real, com quem você quiser.<br />
  Sorteia a letra, todo mundo escreve correndo e quem preencher tudo primeiro grita <strong>STOP!</strong>
</p>

<p align="center">
  <img src="docs/partida.gif" width="640" alt="Duas pessoas jogando ao mesmo tempo, uma no tema dia e outra no tema noite: entram na sala pelo código, a letra é sorteada, as duas escrevem, uma aperta STOP e a outra vê a contagem 3, 2, 1. Depois vêm a correção com votos, o placar e o pódio." />
</p>

## Como se joga

1. Alguém cria uma sala e manda o **código de 5 letras** (ou o link, ou o QR code). Sem cadastro: só apelido e um bicho para representar você.
2. Quem é dono da sala escolhe as categorias, o número de rodadas, o tempo e as letras fora do sorteio. Todo mundo marca "pronto".
3. **Sorteio:** as letras giram até parar. A mesma letra não se repete na partida.
4. **Respostas:** um campo por categoria e o cronômetro correndo. O botão **STOP** só libera com tudo preenchido. Quem aperta primeiro trava a rodada para todo mundo, com 3 segundos para terminar a palavra.
5. **Correção:** uma categoria por vez, com o bicho de cada pessoa ao lado da resposta. Cada um vota 👍 ou 👎 nas respostas dos outros. A maioria de 👎 anula, e o empate mantém. Resposta em branco, com a letra errada ou que é só a letra já chega anulada.
6. **Pontos:** 10 para resposta válida e única, 5 para cada um quando a resposta se repete, 0 para anulada.
7. No fim: pódio com confete, a resposta mais votada, quem mais apertou STOP e a categoria em que a sala mais errou.

<p align="center">
  <img src="docs/telas.png" width="760" alt="Oito telas do Stopou!: início, escolha do bicho, respostas, aviso de STOP no tema noite, correção com votos, placar da rodada, pódio e ranking." />
</p>

## O que tem

- Multiplayer em tempo real, de 2 a 10 pessoas por sala, com **Socket.IO**.
- **Reconexão:** atualizou a página ou a internet caiu? Você volta para o mesmo lugar, com apelido, pontos e respostas.
- **Jogar agora:** entra numa sala pública com quem estiver online, ou abre uma nova. Quem é dono pode deixar qualquer sala pública ou particular.
- **Categorias do seu jeito:** marque, desmarque e crie categorias novas. Dá para **salvar listas** ("Nossa lista", "Rapidinha"…) e aplicar com um toque. A próxima sala que você criar já nasce com as regras da última.
- **24 bichos** para escolher, vários da fauna brasileira (caramelo, capivara, onça, tucano, mico-leão…). Cada um é um arquivo separado, fácil de redesenhar (veja [docs/personagens.md](docs/personagens.md)).
- **Histórico e ranking:** suas últimas partidas e um ranking de vitórias, guardados no Postgres. Sem cadastro.
- **Reações** com emojis que flutuam na tela de todo mundo (sem chat livre, para não precisar moderar).
- **Visual de jogo:** o mascote **Tic** (um cronômetro que grita STOP), fundo azul com raios, cartões com contorno, botões em 3D e as fontes Lilita One e Baloo 2. Tem tema **dia** e tema **noite**.
- **Sons originais**, sintetizados no navegador, com botão de silenciar que fica salvo.
- **Feito para celular e para jogar com uma mão:** botões grandes, STOP fixo embaixo, Enter pula para o próximo campo. Funciona de 360 px até monitor grande.
- **Instala como app** no celular (PWA): ícone na tela inicial, abre em tela cheia e carrega rápido.
- **Acessível:** foco visível, tudo funciona pelo teclado, o cronômetro é anunciado para leitores de tela só aos 30 s, aos 10 s e no fim, e certo e errado nunca dependem só da cor (sempre com ícone e texto). Respeita `prefers-reduced-motion`.

<p align="center">
  <img src="docs/monitor.png" width="640" alt="Tela inicial do Stopou! num monitor." />
</p>

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
| `resposta:rascunho`, `rodada:stop` | `reacao`: emoji flutuante |
| `voto:enviar`, `correcao:pronto`, `resultado:pronto`, `reacao:enviar` | `jogador:removido` |
| `sala:jogarAgora` (com confirmação) | |

Fora do Socket.IO, há três rotas HTTP:

| Rota | O que devolve |
|---|---|
| `GET /health` | se o servidor está de pé e se tem banco ligado |
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

## Fases

- **Fase 1:** salas por código, partida completa em tempo real, reconexão, visual, sons, acessibilidade, testes e CI.
- **Fase 2:** salas públicas com "Jogar agora", listas de categorias salvas, histórico e ranking com Postgres, e instalação como app.

Ideias para depois: contas opcionais para levar o histórico entre aparelhos, moderação de salas públicas (denunciar apelido) e um modo "revanche" com placar acumulado entre partidas.

## Originalidade

Nome, logo, avatares, textos, sons e visual foram feitos para este projeto. Os sons são gerados por código com Web Audio. Só as regras clássicas da adedonha são as de sempre.
