import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as conectar, type Socket } from 'socket.io-client';
import type {
  ClienteParaServidor,
  EstadoSala,
  LinhaRanking,
  PartidaNoHistorico,
  RespostaArquivo,
  RespostaEntrada,
  ServidorParaCliente,
} from '@rabisco/shared';
import { ArquivoPostgres } from '../src/arquivo/postgres';
import { iniciarServidor, type ServidorRodando } from '../src/socket/servidor';

type Cliente = Socket<ServidorParaCliente, ClienteParaServidor>;

const CATEGORIAS = ['Nome', 'Animal', 'Cor'];

let servidor: ServidorRodando;
const clientes: Cliente[] = [];

/** Cliente de teste que guarda o último retrato recebido e sabe esperar por uma condição. */
function novoCliente() {
  const socket: Cliente = conectar(`http://localhost:${servidor.porta}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
  clientes.push(socket);
  let estado: EstadoSala | null = null;
  const esperas: { condicao: (e: EstadoSala) => boolean; resolver: (e: EstadoSala) => void }[] = [];

  socket.on('sala:estado', (novo) => {
    estado = novo;
    for (const espera of [...esperas]) {
      if (espera.condicao(novo)) {
        esperas.splice(esperas.indexOf(espera), 1);
        espera.resolver(novo);
      }
    }
  });

  return {
    socket,
    get estado() {
      return estado!;
    },
    esperar(condicao: (e: EstadoSala) => boolean): Promise<EstadoSala> {
      if (estado && condicao(estado)) return Promise.resolve(estado);
      return new Promise((resolver, rejeitar) => {
        esperas.push({ condicao, resolver });
        setTimeout(() => rejeitar(new Error(`Tempo esgotado. Fase atual: ${estado?.fase}`)), 4000);
      });
    },
  };
}

function emitirComAck<E extends 'sala:criar' | 'sala:entrar' | 'sala:reconectar' | 'sala:jogarAgora'>(
  socket: Cliente,
  evento: E,
  dados: Parameters<ClienteParaServidor[E]>[0],
): Promise<RespostaEntrada> {
  return new Promise((resolver) => {
    (socket.emit as (e: string, d: unknown, ack: (r: RespostaEntrada) => void) => void)(evento, dados, resolver);
  });
}

const DURACOES_RAPIDAS = { sorteio: 50, trava: 100, folgaRespostas: 50, resultado: 2000 };

beforeEach(async () => {
  servidor = await iniciarServidor({ duracoes: DURACOES_RAPIDAS });
});

afterEach(async () => {
  for (const c of clientes.splice(0)) c.disconnect();
  await servidor.fechar();
});

describe('partida com 3 clientes', () => {
  it('cria, entra, joga uma rodada inteira com alguém que cai e volta, e vê o placar', async () => {
    const ana = novoCliente();
    const bia = novoCliente();
    const caio = novoCliente();

    // Entrar na sala
    const criada = await emitirComAck(ana.socket, 'sala:criar', { apelido: 'Ana', avatar: 0, dispositivo: 'aparelho-ana' });
    expect(criada.ok).toBe(true);
    if (!criada.ok) return;
    const codigo = criada.codigo;
    expect(codigo).toMatch(/^[A-Z]{5}$/);

    const repetido = await emitirComAck(bia.socket, 'sala:entrar', { codigo, apelido: 'ana', avatar: 1, dispositivo: 'aparelho-ana' });
    expect(repetido).toEqual({ ok: false, erro: 'Já tem alguém com esse apelido nessa sala.' });

    const entradaBia = await emitirComAck(bia.socket, 'sala:entrar', { codigo, apelido: 'Bia', avatar: 1, dispositivo: 'aparelho-bia' });
    const entradaCaio = await emitirComAck(caio.socket, 'sala:entrar', { codigo, apelido: 'Caio', avatar: 2, dispositivo: 'aparelho-caio' });
    expect(entradaBia.ok && entradaCaio.ok).toBe(true);
    if (!entradaCaio.ok) return;

    await ana.esperar((e) => e.jogadores.length === 3);

    // Configurar e começar
    ana.socket.emit('sala:configurar', {
      categorias: CATEGORIAS,
      rodadas: 1,
      tempoRodadaSeg: 30,
      letrasExcluidas: [],
      publica: false,
    });
    await bia.esperar((e) => e.config.categorias.length === 3);
    bia.socket.emit('jogador:pronto', { pronto: true });
    caio.socket.emit('jogador:pronto', { pronto: true });
    await ana.esperar((e) => e.jogadores.filter((j) => j.pronto).length === 2);
    ana.socket.emit('partida:iniciar');

    const emJogo = await ana.esperar((e) => e.fase === 'respostas');
    const letra = emJogo.letra!;
    expect(emJogo.terminaEm! - emJogo.agora).toBeGreaterThan(29_000);

    // Respostas: Ana e Bia repetem o nome, Caio cai no meio e volta
    const respostasAna = { Nome: `${letra}lice`, Animal: `${letra}rara`, Cor: `${letra}zul` };
    for (const [categoria, texto] of Object.entries(respostasAna)) {
      ana.socket.emit('resposta:rascunho', { categoria, texto });
    }
    bia.socket.emit('resposta:rascunho', { categoria: 'Nome', texto: `${letra.toLowerCase()}LICE` });
    caio.socket.emit('resposta:rascunho', { categoria: 'Animal', texto: `${letra}nta` });
    await ana.esperar((e) => e.jogadores.find((j) => j.apelido === 'Caio')!.preenchidas === 1);

    caio.socket.disconnect();
    await ana.esperar((e) => e.jogadores.find((j) => j.apelido === 'Caio')!.online === false);

    const caioDeVolta = novoCliente();
    const reconexao = await emitirComAck(caioDeVolta.socket, 'sala:reconectar', {
      codigo,
      token: entradaCaio.token,
    });
    expect(reconexao.ok).toBe(true);
    const estadoCaio = await caioDeVolta.esperar((e) => e.fase === 'respostas');
    expect(estadoCaio.minhasRespostas).toEqual({ Animal: `${letra}nta` });
    expect(estadoCaio.jogadores.find((j) => j.apelido === 'Caio')!.online).toBe(true);

    // STOP: sem tudo preenchido é recusado; Bia não vê as respostas da Ana
    expect(bia.estado.minhasRespostas.Animal).toBeUndefined();
    const erroStop = new Promise<string>((r) => bia.socket.once('sala:erro', (e) => r(e.mensagem)));
    bia.socket.emit('rodada:stop', { respostas: {} });
    expect(await erroStop).toMatch(/todas as categorias/);

    const avisoStop = new Promise((r) => caioDeVolta.socket.once('rodada:stop', r));
    ana.socket.emit('rodada:stop', { respostas: respostasAna });
    expect(await avisoStop).toMatchObject({ apelido: 'Ana' });

    // Correção: categoria Nome
    const nome = await ana.esperar((e) => e.fase === 'correcao' && e.correcao?.indice === 0);
    expect(nome.correcao!.respostas.map((r) => r.texto)).toEqual([`${letra}lice`, `${letra.toLowerCase()}LICE`, '']);
    expect(nome.correcao!.respostas[2]!.motivo).toBe('vazia');
    for (const c of [ana, bia, caioDeVolta]) c.socket.emit('correcao:pronto', { indice: 0 });

    // Categoria Animal: Ana e Bia votam contra a resposta do Caio
    await ana.esperar((e) => e.correcao?.indice === 1);
    const anta = ana.estado.jogadores.find((j) => j.apelido === 'Caio')!.id;
    ana.socket.emit('voto:enviar', { indice: 1, jogadorId: anta, voto: 'nao' });
    bia.socket.emit('voto:enviar', { indice: 1, jogadorId: anta, voto: 'nao' });
    // Voto em categoria já fechada é ignorado
    bia.socket.emit('voto:enviar', { indice: 0, jogadorId: anta, voto: 'sim' });
    await ana.esperar((e) => Object.keys(e.correcao?.respostas[2]?.votos ?? {}).length === 2);
    for (const c of [ana, bia, caioDeVolta]) c.socket.emit('correcao:pronto', { indice: 1 });

    await ana.esperar((e) => e.correcao?.indice === 2);
    for (const c of [ana, bia, caioDeVolta]) c.socket.emit('correcao:pronto', { indice: 2 });

    // Placar da rodada: Ana 5 + 10 + 10, Bia 5, Caio 0 (anta anulada por votos)
    const resultado = await bia.esperar((e) => e.fase === 'resultado');
    const pontos = Object.fromEntries(resultado.resultado!.linhas.map((l) => [l.apelido, l.pontosRodada]));
    expect(pontos).toEqual({ Ana: 25, Bia: 5, Caio: 0 });

    // Como era a única rodada, o próximo passo é o fim
    for (const c of [ana, bia, caioDeVolta]) c.socket.emit('resultado:pronto', { rodada: 1 });
    const fim = await caioDeVolta.esperar((e) => e.fase === 'fim');
    expect(fim.fim!.classificacao[0]).toMatchObject({ apelido: 'Ana', posicao: 1, pontos: 25 });
    expect(fim.fim!.resumo.maisStops).toEqual({ apelido: 'Ana', quantidade: 1 });
    expect(fim.fim!.resumo.categoriaMaisErrada?.categoria).toBe('Animal');
  });

  it('recusa entrar em sala que não existe', async () => {
    const ana = novoCliente();
    const r = await emitirComAck(ana.socket, 'sala:entrar', { codigo: 'ZZZZZ', apelido: 'Ana', avatar: 0, dispositivo: 'aparelho-ana' });
    expect(r).toEqual({ ok: false, erro: 'Não achei essa sala. Confere o código?' });
  });

  it('recusa dados inválidos com a mensagem do schema', async () => {
    const ana = novoCliente();
    const r = await emitirComAck(ana.socket, 'sala:criar', { apelido: 'x'.repeat(20), avatar: 0, dispositivo: 'aparelho-x' });
    expect(r).toEqual({ ok: false, erro: 'O apelido pode ter até 16 caracteres.' });
  });

  it('avisa e remove quem é expulso pelo dono', async () => {
    const ana = novoCliente();
    const bia = novoCliente();
    const criada = await emitirComAck(ana.socket, 'sala:criar', { apelido: 'Ana', avatar: 0, dispositivo: 'aparelho-ana' });
    if (!criada.ok) throw new Error('não criou');
    await emitirComAck(bia.socket, 'sala:entrar', { codigo: criada.codigo, apelido: 'Bia', avatar: 1, dispositivo: 'aparelho-bia' });
    const estado = await ana.esperar((e) => e.jogadores.length === 2);
    const removida = new Promise((r) => bia.socket.once('jogador:removido', () => r(true)));
    ana.socket.emit('sala:remover', { jogadorId: estado.jogadores[1]!.id });
    expect(await removida).toBe(true);
    await ana.esperar((e) => e.jogadores.length === 1);
  });

  it('descarta eventos em excesso de uma mesma conexão', async () => {
    const ana = novoCliente();
    await emitirComAck(ana.socket, 'sala:criar', { apelido: 'Ana', avatar: 0, dispositivo: 'aparelho-ana' });
    const erro = new Promise<string>((r) => ana.socket.once('sala:erro', (e) => r(e.mensagem)));
    for (let i = 0; i < 60; i++) ana.socket.emit('reacao:enviar', { emoji: '🔥' });
    expect(await erro).toMatch(/Calma/);
  });
});

describe('Jogar agora', () => {
  it('junta quem toca em "Jogar agora" na mesma sala pública', async () => {
    const ana = novoCliente();
    const bia = novoCliente();
    const r1 = await emitirComAck(ana.socket, 'sala:jogarAgora', { apelido: 'Ana', avatar: 0, dispositivo: 'aparelho-ana' });
    const r2 = await emitirComAck(bia.socket, 'sala:jogarAgora', { apelido: 'Bia', avatar: 1, dispositivo: 'aparelho-bia' });
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    expect(r2.codigo).toBe(r1.codigo);
    const estado = await ana.esperar((e) => e.jogadores.length === 2);
    expect(estado.config.publica).toBe(true);
  });

  it('não coloca ninguém em sala particular', async () => {
    const ana = novoCliente();
    const bia = novoCliente();
    const privada = await emitirComAck(ana.socket, 'sala:criar', { apelido: 'Ana', avatar: 0, dispositivo: 'aparelho-ana' });
    const publica = await emitirComAck(bia.socket, 'sala:jogarAgora', { apelido: 'Bia', avatar: 1, dispositivo: 'aparelho-bia' });
    expect(privada.ok && publica.ok).toBe(true);
    if (!privada.ok || !publica.ok) return;
    expect(publica.codigo).not.toBe(privada.codigo);
  });

  it('abre outra sala pública quando o apelido já está em uso na que tem vaga', async () => {
    const ana = novoCliente();
    const outraAna = novoCliente();
    const r1 = await emitirComAck(ana.socket, 'sala:jogarAgora', { apelido: 'Ana', avatar: 0, dispositivo: 'aparelho-ana' });
    const r2 = await emitirComAck(outraAna.socket, 'sala:jogarAgora', { apelido: 'ana', avatar: 2, dispositivo: 'aparelho-ana2' });
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    expect(r2.codigo).not.toBe(r1.codigo);
  });
});

describe('histórico e ranking', () => {
  it('sem banco, as rotas respondem que o recurso está desligado', async () => {
    const resposta = await fetch(`http://localhost:${servidor.porta}/ranking`);
    expect(await resposta.json()).toEqual({ ativo: false });
  });

  it('com banco, a partida terminada aparece no histórico e no ranking', async () => {
    await servidor.fechar();
    servidor = await iniciarServidor({
      duracoes: DURACOES_RAPIDAS,
      arquivo: await ArquivoPostgres.abrir(new PGlite()),
    });

    const ana = novoCliente();
    const bia = novoCliente();
    const criada = await emitirComAck(ana.socket, 'sala:criar', { apelido: 'Ana', avatar: 3, dispositivo: 'aparelho-ana' });
    if (!criada.ok) throw new Error('não criou');
    await emitirComAck(bia.socket, 'sala:entrar', {
      codigo: criada.codigo,
      apelido: 'Bia',
      avatar: 4,
      dispositivo: 'aparelho-bia',
    });
    await ana.esperar((e) => e.jogadores.length === 2);
    ana.socket.emit('sala:configurar', {
      categorias: ['Nome'],
      rodadas: 1,
      tempoRodadaSeg: 30,
      letrasExcluidas: [],
      publica: false,
    });
    await bia.esperar((e) => e.config.categorias.length === 1);
    bia.socket.emit('jogador:pronto', { pronto: true });
    await ana.esperar((e) => e.jogadores.every((j) => j.dono || j.pronto));
    ana.socket.emit('partida:iniciar');
    const { letra } = await ana.esperar((e) => e.fase === 'respostas');
    ana.socket.emit('rodada:stop', { respostas: { Nome: `${letra}na` } });
    await ana.esperar((e) => e.fase === 'correcao');
    for (const c of [ana, bia]) c.socket.emit('correcao:pronto', { indice: 0 });
    await ana.esperar((e) => e.fase === 'resultado');
    for (const c of [ana, bia]) c.socket.emit('resultado:pronto', { rodada: 1 });
    await ana.esperar((e) => e.fase === 'fim');

    // A gravação é assíncrona: espera ela aparecer.
    let ranking: LinhaRanking[] = [];
    for (let tentativa = 0; tentativa < 40 && !ranking.length; tentativa++) {
      await new Promise((r) => setTimeout(r, 50));
      const resposta = (await (
        await fetch(`http://localhost:${servidor.porta}/ranking?dispositivo=aparelho-bia`)
      ).json()) as RespostaArquivo<LinhaRanking[]>;
      expect(resposta.ativo).toBe(true);
      if (resposta.ativo) ranking = resposta.dados;
    }
    expect(ranking.map((l) => [l.apelido, l.vitorias, l.eu])).toEqual([
      ['Ana', 1, false],
      ['Bia', 0, true],
    ]);

    const historico = (await (
      await fetch(`http://localhost:${servidor.porta}/historico?dispositivo=aparelho-ana`)
    ).json()) as RespostaArquivo<PartidaNoHistorico[]>;
    if (!historico.ativo) throw new Error('histórico deveria estar ativo');
    expect(historico.dados).toHaveLength(1);
    expect(historico.dados[0]).toMatchObject({ minhaPosicao: 1, meusPontos: 10, categorias: ['Nome'] });
  }, 20_000);

  it('histórico exige o identificador do aparelho', async () => {
    const resposta = await fetch(`http://localhost:${servidor.porta}/historico`);
    expect(resposta.status).toBe(400);
  });
});
