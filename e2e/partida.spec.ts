import { expect, test, type Page } from '@playwright/test';

async function criarSala(pagina: Page, apelido: string) {
  await pagina.goto('/');
  await pagina.getByRole('button', { name: 'Criar sala' }).click();
  await pagina.getByLabel('Seu apelido').fill(apelido);
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
  await pagina.getByRole('radio', { name: 'Panda' }).click();
  await pagina.getByRole('button', { name: 'Entrar', exact: true }).click();
}

const campos = (pagina: Page) => pagina.locator('input.linha-escrita');

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

  for (const pagina of [ana, bia]) await pagina.getByRole('button', { name: 'Ver o pódio!' }).click();
  await expect(bia.getByRole('heading', { name: 'Fim de jogo!' })).toBeVisible();
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
