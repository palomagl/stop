import { expect, test, type Page } from '@playwright/test';

async function criarSala(pagina: Page, apelido: string) {
  await pagina.goto('/');
  await pagina.getByRole('button', { name: 'Criar sala' }).click();
  await pagina.getByLabel('Seu apelido').fill(apelido);
  await pagina.getByRole('button', { name: 'Tradicionais', exact: true }).click();
  await pagina.getByRole('radio', { name: 'Gato' }).click();
  await pagina.getByRole('button', { name: 'Criar sala' }).click();
  await expect(pagina.getByText('Código da sala', { exact: true })).toBeVisible();
  return new URL(pagina.url()).pathname.slice(1);
}

async function entrarPorCodigo(pagina: Page, codigo: string, apelido: string) {
  await pagina.goto('/');
  await pagina.getByRole('button', { name: 'Entrar com código' }).click();
  await pagina.getByLabel('Código da sala').fill(codigo);
  await pagina.getByLabel('Seu apelido').fill(apelido);
  await pagina.getByRole('button', { name: 'Tradicionais', exact: true }).click();
  await pagina.getByRole('radio', { name: 'Panda' }).click();
  await pagina.getByRole('button', { name: 'Entrar', exact: true }).click();
}

const campos = (pagina: Page) => pagina.locator('form input.campo');

test('duas pessoas criam e entram na sala, jogam uma rodada e veem o placar', async ({ browser }) => {
  const ana = await (await browser.newContext()).newPage();
  const bia = await (await browser.newContext()).newPage();

  const codigo = await criarSala(ana, 'Ana');
  expect(codigo).toMatch(/^[A-Z]{5}$/);

  await entrarPorCodigo(bia, codigo, 'Bia');
  await expect(ana.getByText('Bia', { exact: true })).toBeVisible();

  // A dona deixa só duas categorias e uma rodada
  for (const categoria of ['CEP', 'Cor', 'Fruta', 'Objeto', 'Comida', 'Marca', 'Profissão', 'Filme', 'Parte do corpo', 'MSÉ']) {
    const botao = ana.getByRole('button', { name: new RegExp(`^${categoria}`) });
    await botao.click();
    await expect(botao).toHaveAttribute('aria-pressed', 'false');
  }
  for (let i = 0; i < 4; i++) await ana.getByRole('button', { name: 'Menos uma rodada' }).click();
  await expect(bia.getByText(/1 rodada de até/)).toBeVisible();

  const comecar = ana.getByRole('button', { name: 'Começar partida' });
  await expect(comecar).toBeDisabled();
  await bia.getByRole('button', { name: 'Estou pronto!' }).click();
  await expect(comecar).toBeEnabled();
  await comecar.click();

  // Sorteio
  await expect(ana.getByText(/A letra é [A-Z]!/)).toBeVisible({ timeout: 10_000 });
  const letra = (await ana.getByText(/A letra é/).textContent())!.match(/A letra é ([A-Z])/)![1]!;

  // Respostas
  await expect(campos(ana)).toHaveCount(2, { timeout: 10_000 });
  await campos(ana).nth(0).fill(`${letra}lice`);
  await campos(ana).nth(1).fill(`${letra}rara`);
  await campos(bia).nth(0).fill(`${letra}LICE`);
  await expect(bia.getByRole('button', { name: 'STOP!' })).toBeDisabled();

  // Bia atualiza a página no meio da rodada e volta com a resposta salva
  await bia.waitForTimeout(600);
  await bia.reload();
  await expect(campos(bia).nth(0)).toHaveValue(`${letra}LICE`);

  await ana.getByRole('button', { name: 'STOP!' }).click();
  await expect(bia.getByText('Ana parou. Termine a palavra!')).toBeVisible();

  // Correção: Nome repetido, Animal da Bia em branco
  await expect(ana.getByRole('heading', { name: 'Nome' })).toBeVisible({ timeout: 10_000 });
  await expect(ana.getByText('vale 5')).toHaveCount(2);
  for (const pagina of [ana, bia]) await pagina.getByRole('button', { name: 'Pronto, próxima!' }).click();

  await expect(bia.getByRole('heading', { name: 'Animal' })).toBeVisible();
  await expect(bia.getByText('em branco').first()).toBeVisible();
  for (const pagina of [ana, bia]) await pagina.getByRole('button', { name: 'Pronto, ver pontos!' }).click();

  // Placar: Ana 5 + 10, Bia 5
  await expect(ana.getByRole('heading', { name: 'Placar da rodada' })).toBeVisible();
  await expect(ana.getByLabel('15 pontos nesta rodada', { exact: true })).toBeVisible();
  await expect(bia.getByLabel('5 pontos nesta rodada', { exact: true })).toBeVisible();
  await expect(ana.getByRole('heading', { name: 'Folha da rodada' })).toBeVisible();
  await expect(ana.getByText(`${letra}rara`)).toBeVisible();

  for (const pagina of [ana, bia]) await pagina.getByRole('button', { name: 'Ver o pódio!' }).click();
  // Pódio com suspense: a Ana pula a animação, a Bia assiste até o fim.
  await expect(ana.getByRole('heading', { name: /E o pódio vai para/ })).toBeVisible();
  await ana.getByRole('button', { name: /Pular/ }).click();
  await expect(ana.getByRole('heading', { name: 'Pódio!' })).toBeVisible();
  await expect(ana.getByText('Você ganhou! 🏆')).toBeVisible();
  await expect(bia.getByRole('heading', { name: 'Pódio!' })).toBeVisible({ timeout: 10_000 });
  await expect(bia.getByText('Você está no pódio, em 2º lugar! 🎉')).toBeVisible();
  await expect(ana.getByRole('button', { name: 'Jogar de novo' })).toBeVisible();
  await expect(bia.getByText(/Esperando Ana decidir/)).toBeVisible();
});

test('código errado mostra aviso e não entra', async ({ page }) => {
  await entrarPorCodigo(page, 'ZZZZZ', 'Caio');
  await expect(page.getByRole('alert')).toHaveText('Não achei essa sala. Confere o código?');
});

test('"Jogar agora" junta duas pessoas na mesma sala pública', async ({ browser }) => {
  const paginas = [await (await browser.newContext()).newPage(), await (await browser.newContext()).newPage()];
  for (const [i, pagina] of paginas.entries()) {
    await pagina.goto('/');
    await pagina.getByRole('button', { name: /Jogar agora/ }).click();
    await pagina.getByLabel('Seu apelido').fill(`Pessoa ${i + 1}`);
    await pagina.getByRole('button', { name: 'Procurar sala' }).click();
    await expect(pagina.getByText('Código da sala', { exact: true })).toBeVisible();
  }
  const [a, b] = paginas as [Page, Page];
  expect(new URL(a.url()).pathname).toBe(new URL(b.url()).pathname);
  await expect(a.getByText('Pessoa 2', { exact: true })).toBeVisible();
  await expect(a.getByRole('switch', { name: /Sala pública/ })).toBeChecked();
});

test('lista de categorias salva e regras lembradas para a próxima sala', async ({ page }) => {
  await criarSala(page, 'Ana');
  await page.getByRole('button', { name: /^CEP/ }).click();
  await expect(page.getByRole('button', { name: /^CEP/ })).toHaveAttribute('aria-pressed', 'false');
  await page.getByLabel('Nova categoria').fill('Time de futebol');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(page.getByRole('button', { name: /^Time de futebol/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Salvar estas categorias como lista').fill('Nossa lista');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nossa lista (12)' })).toBeVisible();

  // Sai e cria outra sala: as regras voltam iguais e a lista continua lá
  await page.getByRole('button', { name: 'Sair da sala' }).click();
  await criarSala(page, 'Ana');
  await expect(page.getByRole('button', { name: /^CEP/ })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: /^Time de futebol/ })).toHaveAttribute('aria-pressed', 'true');

  // Aplicar a lista também funciona depois de mexer nas categorias
  await page.getByRole('button', { name: /^Nome/ }).click();
  await expect(page.getByRole('button', { name: /^Nome/ })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Nossa lista (12)' }).click();
  await expect(page.getByRole('button', { name: /^Nome/ })).toHaveAttribute('aria-pressed', 'true');
});

test('ranking avisa quando o servidor está sem banco', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ranking/ }).click();
  await expect(page.getByText(/não está guardando partidas/)).toBeVisible();
});

test('em sala pública, quem é denunciado pela maioria sai da sala', async ({ browser }) => {
  const nomes = ['Ana', 'Bia', 'Chato'];
  const paginas: Page[] = [];
  for (const nome of nomes) {
    const pagina = await (await browser.newContext()).newPage();
    pagina.on('dialog', (d) => d.accept());
    await pagina.goto('/');
    await pagina.getByRole('button', { name: /Jogar agora/ }).click();
    await pagina.getByLabel('Seu apelido').fill(nome);
    await pagina.getByRole('button', { name: 'Procurar sala' }).click();
    await expect(pagina.getByText('Código da sala', { exact: true })).toBeVisible();
    paginas.push(pagina);
  }
  const [ana, bia, chato] = paginas as [Page, Page, Page];
  await expect(ana.getByText('Chato', { exact: true })).toBeVisible();

  await ana.getByRole('button', { name: 'Denunciar o apelido Chato' }).click();
  await expect(ana.getByRole('button', { name: 'Você já denunciou Chato' })).toBeDisabled();
  await expect(chato.getByText('Código da sala', { exact: true })).toBeVisible();

  await bia.getByRole('button', { name: 'Denunciar o apelido Chato' }).click();
  await expect(chato.getByText('Seu apelido foi denunciado pela sala e você saiu dela.')).toBeVisible();
  await expect(chato.getByRole('button', { name: /Jogar agora/ })).toBeVisible();
  await expect(ana.getByText('Chato', { exact: true })).toHaveCount(0);
});

test('seleção pelo teclado e sala sem cortes em tela estreita', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar sala', exact: true }).click();
  await page.getByRole('button', { name: 'Tradicionais', exact: true }).click();
  await page.getByRole('radio', { name: 'Caramelo', exact: true }).press('End');
  await expect(page.getByRole('radio', { name: 'Dragão', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: 'Dragão', exact: true })).toBeFocused();
  await page.getByRole('radio', { name: 'Dragão', exact: true }).press('Home');
  await expect(page.getByRole('radio', { name: 'Caramelo', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: 'Caramelo', exact: true }).press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Gato', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Usar tema noite' }).click();
  await expect(page.getByRole('button', { name: 'Usar tema dia' })).toBeVisible();
  await page.getByLabel('Seu apelido').fill('Paloma');
  await page.getByRole('button', { name: 'Criar sala', exact: true }).click();
  await expect(page.getByText('Código da sala', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Gato', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Silenciar sons' })).toBeInViewport();
  await page.getByRole('switch').click();
  await expect(page.getByRole('switch')).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


test('três coleções mantêm IDs e a escolha após reconectar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar sala', exact: true }).click();
  for (const [colecao, quantidade] of [['Divertidos', 30], ['Tradicionais', 24], ['Extras', 30]] as const) {
    await page.getByRole('button', { name: colecao, exact: true }).click();
    await expect(page.getByRole('radio')).toHaveCount(quantidade);
    await page.getByRole('radiogroup').locator('img').evaluateAll((imgs) => Promise.all(imgs.map((img) => (img as HTMLImageElement).decode())));
  }
  await page.getByRole('button', { name: 'Divertidos', exact: true }).click();
  await page.getByRole('radio', { name: 'Planeta', exact: true }).click();
  await page.getByRole('button', { name: 'Tradicionais', exact: true }).click();
  await page.getByRole('button', { name: 'Divertidos', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Planeta', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByLabel('Seu apelido').fill('Astral');
  await page.getByRole('button', { name: 'Criar sala', exact: true }).click();
  await expect(page.getByText('Código da sala', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Planeta', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('img', { name: 'Planeta', exact: true })).toBeVisible();
});

test('pacote pronto de categorias e votação para pular a letra', async ({ browser }) => {
  const ana = await (await browser.newContext()).newPage();
  const bia = await (await browser.newContext()).newPage();
  const codigo = await criarSala(ana, 'Ana');
  await entrarPorCodigo(bia, codigo, 'Bia');

  await ana.getByRole('button', { name: /Rapidinho/ }).click();
  await expect(ana.getByRole('button', { name: /Rapidinho/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(bia.getByText(/pacote ⚡ Rapidinho/)).toBeVisible();

  await bia.getByRole('button', { name: 'Estou pronto!' }).click();
  await ana.getByRole('button', { name: 'Começar partida' }).click();
  await expect(campos(ana)).toHaveCount(5, { timeout: 10_000 });
  const primeira = (await ana.getByLabel(/^Letra [A-Z]$/).getAttribute('aria-label'))!.slice(-1);

  await ana.getByRole('button', { name: /Votar para pular a letra/ }).click();
  await expect(ana.getByRole('button', { name: /Você votou para pular a letra/ })).toBeDisabled();
  await bia.getByRole('button', { name: /Votar para pular a letra/ }).click();
  await expect(bia.getByText(`A letra ${primeira} foi pulada. Sorteando outra!`)).toBeVisible();

  await expect(campos(bia)).toHaveCount(5, { timeout: 10_000 });
  const nova = (await bia.getByLabel(/^Letra [A-Z]$/).getAttribute('aria-label'))!.slice(-1);
  expect(nova).not.toBe(primeira);
  // Só um pulo por partida
  await expect(bia.getByRole('button', { name: /pular a letra/ })).toHaveCount(0);
});

test('contra robôs: eles entram prontos, escrevem aos poucos e aparecem na correção', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Contra robôs' }).click();
  await page.getByLabel('Seu apelido').fill('Paloma');
  await page.getByRole('radio', { name: 'Difícil' }).click();
  await page.getByRole('radio', { name: '2 robôs' }).click();
  await page.getByRole('button', { name: 'Chamar os robôs' }).click();

  await expect(page.getByText('Código da sala', { exact: true })).toBeVisible();
  await expect(page.getByText('robô difícil')).toHaveCount(2);
  await page.getByRole('button', { name: /Rapidinho/ }).click();
  await page.getByRole('button', { name: 'Começar partida' }).click();

  await expect(campos(page)).toHaveCount(5, { timeout: 10_000 });
  const progresso = page.getByRole('list', { name: 'Progresso dos outros jogadores' });
  await expect(progresso).toContainText('0/5');
  // Robô não é instantâneo: a primeira resposta leva uns segundos.
  await expect(progresso).toContainText(/[1-5]\/5/, { timeout: 20_000 });

  const letra = (await page.getByLabel(/^Letra [A-Z]$/).getAttribute('aria-label'))!.slice(-1);
  for (let i = 0; i < 5; i++) await campos(page).nth(i).fill(`${letra}palavra${i}`);
  await page.getByRole('button', { name: 'STOP!' }).click();

  await expect(page.getByText(/Correção/).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('img', { name: 'robô' }).first()).toBeVisible();
});
