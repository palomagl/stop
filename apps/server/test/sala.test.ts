import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DURACOES, type Config } from '@rabisco/shared';
import { Sala, type Jogador } from '../src/jogo/sala';

const CONFIG: Config = {
  categorias: ['Nome', 'Animal'],
  rodadas: 2,
  tempoRodadaSeg: 30,
  letrasExcluidas: ['K', 'W', 'Y', 'X', 'Q'],
};

function novaSala(aleatorio = () => 0) {
  const sala = new Sala('TESTE', { duracoes: DURACOES, aleatorio });
  const entrar = (apelido: string) => {
    const j = sala.adicionarJogador(apelido, 0) as Jogador;
    sala.conectar(j, `socket-${apelido}`);
    return j;
  };
  const ana = entrar('Ana');
  const bia = entrar('Bia');
  sala.configurar(ana.id, CONFIG);
  return { sala, ana, bia, entrar };
}

/** Leva a sala do lobby até a fase de respostas. */
function comecar(sala: Sala, dono: Jogador, outros: Jogador[]) {
  for (const j of outros) sala.marcarPronto(j.id, true);
  expect(sala.iniciar(dono.id)).toBeNull();
  vi.advanceTimersByTime(DURACOES.sorteio);
  expect(sala.fase).toBe('respostas');
}

function responder(sala: Sala, jogador: Jogador, respostas: Record<string, string>) {
  for (const [categoria, texto] of Object.entries(respostas)) sala.rascunho(jogador.id, categoria, texto);
}

describe('Sala', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('lobby', () => {
    it('quem cria vira dono', () => {
      const { sala, ana } = novaSala();
      expect(sala.donoId).toBe(ana.id);
    });

    it('recusa apelido repetido, mesmo com acento e maiúscula diferentes', () => {
      const { sala } = novaSala();
      expect(sala.adicionarJogador('ána', 1)).toBe('Já tem alguém com esse apelido nessa sala.');
    });

    it('recusa a 11ª pessoa', () => {
      const { sala, entrar } = novaSala();
      for (let i = 0; i < 8; i++) entrar(`J${i}`);
      expect(sala.adicionarJogador('Sobrou', 0)).toBe('A sala está cheia.');
    });

    it('só o dono configura e começa', () => {
      const { sala, bia } = novaSala();
      expect(sala.configurar(bia.id, CONFIG)).toMatch(/dono/);
      expect(sala.iniciar(bia.id)).toMatch(/dono/);
    });

    it('não começa com gente que não está pronta', () => {
      const { sala, ana } = novaSala();
      expect(sala.iniciar(ana.id)).toMatch(/pronta/);
      expect(sala.fase).toBe('lobby');
    });

    it('não começa com menos de 2 pessoas online', () => {
      const { sala, ana, bia } = novaSala();
      sala.marcarPronto(bia.id, true);
      sala.desconectar(bia.id, 'socket-Bia');
      expect(sala.iniciar(ana.id)).toMatch(/pelo menos 2/);
    });

    it('se o dono sai, outra pessoa vira dona', () => {
      const { sala, ana, bia } = novaSala();
      sala.sair(ana.id);
      expect(sala.donoId).toBe(bia.id);
    });

    it('o dono pode remover alguém, mas não o contrário', () => {
      const { sala, ana, bia, entrar } = novaSala();
      const caio = entrar('Caio');
      sala.remover(bia.id, caio.id);
      expect(sala.jogadores.has(caio.id)).toBe(true);
      sala.remover(ana.id, caio.id);
      expect(sala.jogadores.has(caio.id)).toBe(false);
    });

    it('fica vazia e avisa quando o último sai', () => {
      const { sala, ana, bia } = novaSala();
      const vazia = vi.fn();
      sala.on('vazia', vazia);
      sala.sair(ana.id);
      sala.sair(bia.id);
      expect(vazia).toHaveBeenCalledOnce();
    });
  });

  describe('rodada', () => {
    it('sorteia uma letra fora das excluídas e passa para respostas com o prazo certo', () => {
      const { sala, ana, bia } = novaSala();
      comecar(sala, ana, [bia]);
      expect(sala.letra).toBe('A');
      expect(sala.terminaEm).toBe(Date.now() + 30_000);
    });

    it('nunca repete a letra na partida', () => {
      const { sala, ana, bia } = novaSala(() => 0);
      comecar(sala, ana, [bia]);
      vi.advanceTimersByTime(30_000 + DURACOES.folgaRespostas);
      for (let i = 0; i < CONFIG.categorias.length; i++) vi.advanceTimersByTime(DURACOES.correcaoSemVotos);
      vi.advanceTimersByTime(DURACOES.resultado);
      expect(sala.rodada).toBe(2);
      expect(sala.letrasUsadas).toEqual(['A', 'B']);
    });

    it('STOP só vale com tudo preenchido', () => {
      const { sala, ana, bia } = novaSala();
      comecar(sala, ana, [bia]);
      responder(sala, ana, { Nome: 'Ana' });
      expect(sala.stop(ana.id, {})).toMatch(/todas as categorias/);
      expect(sala.fase).toBe('respostas');
    });

    it('STOP aceita as respostas que chegam junto com ele', () => {
      const { sala, ana, bia } = novaSala();
      comecar(sala, ana, [bia]);
      expect(sala.stop(ana.id, { Nome: 'Ana', Animal: 'Arara' })).toBeNull();
      expect(sala.fase).toBe('travando');
      expect(sala.stopPor).toBe(ana.id);
    });

    it('trava por 3 segundos aceitando rascunhos e depois fecha', () => {
      const { sala, ana, bia } = novaSala();
      comecar(sala, ana, [bia]);
      sala.stop(ana.id, { Nome: 'Ana', Animal: 'Arara' });
      responder(sala, bia, { Nome: 'Alice' });
      vi.advanceTimersByTime(DURACOES.trava);
      expect(sala.fase).toBe('correcao');
      responder(sala, bia, { Animal: 'Anta' });
      const estado = sala.estadoPara(ana.id);
      expect(estado.correcao?.categoria).toBe('Nome');
      expect(estado.correcao?.respostas.map((r) => r.texto)).toEqual(['Ana', 'Alice']);
      expect(bia.respostas.get('Animal')).toBeUndefined();
    });

    it('fecha sozinha quando o tempo acaba', () => {
      const { sala, ana, bia } = novaSala();
      comecar(sala, ana, [bia]);
      vi.advanceTimersByTime(30_000);
      expect(sala.fase).toBe('respostas');
      expect(sala.stop(ana.id, { Nome: 'Ana', Animal: 'Arara' })).toBeNull();
      expect(sala.fase).toBe('respostas');
      vi.advanceTimersByTime(DURACOES.folgaRespostas);
      expect(sala.fase).toBe('correcao');
    });

    it('esconde as respostas dos outros durante a rodada', () => {
      const { sala, ana, bia } = novaSala();
      comecar(sala, ana, [bia]);
      responder(sala, bia, { Nome: 'Bia' });
      const visaoAna = sala.estadoPara(ana.id);
      expect(visaoAna.minhasRespostas).toEqual({});
      expect(visaoAna.jogadores.find((j) => j.id === bia.id)?.preenchidas).toBe(1);
    });
  });

  describe('correção e pontos', () => {
    function ateCorrecao() {
      const ctx = novaSala();
      const caio = ctx.entrar('Caio');
      comecar(ctx.sala, ctx.ana, [ctx.bia, caio]);
      responder(ctx.sala, ctx.ana, { Nome: 'Alice', Animal: 'Arara' });
      responder(ctx.sala, ctx.bia, { Nome: 'alice', Animal: 'Anta' });
      responder(ctx.sala, caio, { Nome: 'Bruno', Animal: 'A' });
      ctx.sala.stop(ctx.ana.id, {});
      vi.advanceTimersByTime(DURACOES.trava);
      return { ...ctx, caio };
    }

    it('anula automaticamente letra errada e resposta que é só a letra', () => {
      const { sala, ana } = ateCorrecao();
      const nome = sala.estadoPara(ana.id).correcao!.respostas;
      expect(nome.map((r) => r.motivo)).toEqual([null, null, 'letra']);
    });

    it('não deixa votar na própria resposta nem em categoria já fechada', () => {
      const { sala, ana, bia } = ateCorrecao();
      expect(sala.votar(ana.id, 0, ana.id, 'nao')).toMatch(/própria/);
      expect(sala.votar(ana.id, 1, bia.id, 'nao')).toBeNull();
      expect(sala.estadoPara(ana.id).correcao!.respostas[1]!.votos).toEqual({});
    });

    it('avança quando todo mundo aperta Pronto', () => {
      const { sala, ana, bia, caio } = ateCorrecao();
      for (const j of [ana, bia, caio]) sala.prontoCorrecao(j.id, 0);
      expect(sala.estadoPara(ana.id).correcao!.categoria).toBe('Animal');
    });

    it('avança sozinha depois de 30 segundos', () => {
      const { sala, ana } = ateCorrecao();
      vi.advanceTimersByTime(DURACOES.correcao);
      expect(sala.estadoPara(ana.id).correcao!.categoria).toBe('Animal');
    });

    it('conta 5 para repetida, 10 para única e 0 para anulada por votos', () => {
      const { sala, ana, bia, caio } = ateCorrecao();
      // Nome: Alice (Ana) e alice (Bia) repetem; Bruno já chega anulado.
      for (const j of [ana, bia, caio]) sala.prontoCorrecao(j.id, 0);
      // Animal: Arara (Ana) válida, Anta (Bia) anulada por 2 votos a 0, "A" (Caio) só a letra.
      sala.votar(ana.id, 1, bia.id, 'nao');
      sala.votar(caio.id, 1, bia.id, 'nao');
      for (const j of [ana, bia, caio]) sala.prontoCorrecao(j.id, 1);

      expect(sala.fase).toBe('resultado');
      const linhas = sala.estadoPara(ana.id).resultado!.linhas;
      const pontos = Object.fromEntries(linhas.map((l) => [l.apelido, l.pontosRodada]));
      expect(pontos).toEqual({ Ana: 15, Bia: 5, Caio: 0 });
      expect(linhas[0]).toMatchObject({ apelido: 'Ana', posicao: 1, posicaoAnterior: 1 });
    });

    it('empate nos votos mantém a resposta', () => {
      const { sala, ana, bia, caio } = ateCorrecao();
      for (const j of [ana, bia, caio]) sala.prontoCorrecao(j.id, 0);
      sala.votar(ana.id, 1, bia.id, 'nao');
      sala.votar(caio.id, 1, bia.id, 'sim');
      for (const j of [ana, bia, caio]) sala.prontoCorrecao(j.id, 1);
      const bia2 = sala.estadoPara(ana.id).resultado!.linhas.find((l) => l.apelido === 'Bia');
      expect(bia2?.pontosRodada).toBe(15);
    });
  });

  describe('fim da partida', () => {
    function jogarRodadaRapida(sala: Sala, jogadores: Jogador[]) {
      vi.advanceTimersByTime(DURACOES.sorteio);
      const letra = sala.letra!;
      jogadores.forEach((j, i) => responder(sala, j, { Nome: `${letra}nome${i}`, Animal: `${letra}bicho${i}` }));
      sala.stop(jogadores[0]!.id, {});
      vi.advanceTimersByTime(DURACOES.trava);
      for (let c = 0; c < CONFIG.categorias.length; c++) {
        for (const j of jogadores) sala.prontoCorrecao(j.id, c);
      }
      for (const j of jogadores) sala.prontoResultado(j.id, sala.rodada);
    }

    it('chega ao fim depois da última rodada, com pódio e resumo', () => {
      const { sala, ana, bia } = novaSala();
      sala.marcarPronto(bia.id, true);
      sala.iniciar(ana.id);
      jogarRodadaRapida(sala, [ana, bia]);
      expect(sala.fase).toBe('sorteio');
      jogarRodadaRapida(sala, [ana, bia]);
      expect(sala.fase).toBe('fim');
      const fim = sala.estadoPara(ana.id).fim!;
      expect(fim.classificacao.map((c) => c.pontos)).toEqual([40, 40]);
      expect(fim.resumo.maisStops).toEqual({ apelido: 'Ana', quantidade: 2 });
    });

    it('"Jogar de novo" zera os pontos e começa com as mesmas configurações', () => {
      const { sala, ana, bia } = novaSala();
      sala.marcarPronto(bia.id, true);
      sala.iniciar(ana.id);
      jogarRodadaRapida(sala, [ana, bia]);
      jogarRodadaRapida(sala, [ana, bia]);
      expect(sala.jogarDeNovo(ana.id, false)).toBeNull();
      expect(sala.fase).toBe('sorteio');
      expect(sala.rodada).toBe(1);
      expect(sala.config).toEqual(CONFIG);
      expect([...sala.jogadores.values()].every((j) => j.pontos === 0)).toBe(true);
    });
  });

  describe('reconexão', () => {
    it('quem cai e volta em menos de 2 minutos continua com as respostas', () => {
      const { sala, ana, bia } = novaSala();
      comecar(sala, ana, [bia]);
      responder(sala, bia, { Nome: 'Bia' });
      sala.desconectar(bia.id, 'socket-Bia');
      vi.advanceTimersByTime(20_000);
      sala.conectar(sala.porToken(bia.token)!, 'socket-novo');
      expect(sala.estadoPara(bia.id).minhasRespostas).toEqual({ Nome: 'Bia' });
      vi.advanceTimersByTime(DURACOES.foraDaPartida);
      expect(sala.jogadores.has(bia.id)).toBe(true);
    });

    it('ignora a desconexão de um socket antigo', () => {
      const { sala, bia } = novaSala();
      sala.conectar(bia, 'socket-novo');
      sala.desconectar(bia.id, 'socket-Bia');
      expect(bia.online).toBe(true);
    });

    it('quem fica fora mais de 2 minutos sai, e o jogo continua sem a pessoa', () => {
      const { sala, ana, bia, entrar } = novaSala();
      const caio = entrar('Caio');
      comecar(sala, ana, [bia, caio]);
      sala.desconectar(caio.id, 'socket-Caio');
      vi.advanceTimersByTime(DURACOES.foraDaPartida);
      expect(sala.jogadores.has(caio.id)).toBe(false);
      expect(sala.fase).not.toBe('fim');
    });

    it('se sobrar uma pessoa só, a partida termina', () => {
      const { sala, ana, bia } = novaSala();
      comecar(sala, ana, [bia]);
      sala.desconectar(bia.id, 'socket-Bia');
      vi.advanceTimersByTime(DURACOES.foraDaPartida);
      expect(sala.fase).toBe('fim');
    });

    it('no lobby, quem cai continua na sala, mas o dono passa para quem está online', () => {
      const { sala, ana, bia } = novaSala();
      sala.desconectar(ana.id, 'socket-Ana');
      vi.advanceTimersByTime(DURACOES.foraDaPartida);
      expect(sala.jogadores.has(ana.id)).toBe(true);
      expect(sala.donoId).toBe(bia.id);
    });

    it('com quem cai durante a correção, os outros avançam sem esperar', () => {
      const { sala, ana, bia, entrar } = novaSala();
      const caio = entrar('Caio');
      comecar(sala, ana, [bia, caio]);
      vi.advanceTimersByTime(30_000 + DURACOES.folgaRespostas);
      sala.prontoCorrecao(ana.id, 0);
      sala.prontoCorrecao(bia.id, 0);
      expect(sala.estadoPara(ana.id).correcao!.indice).toBe(0);
      sala.desconectar(caio.id, 'socket-Caio');
      expect(sala.estadoPara(ana.id).correcao!.indice).toBe(1);
    });
  });

  it('limita reações seguidas da mesma pessoa', () => {
    const { sala, ana } = novaSala();
    const reacoes = vi.fn();
    sala.on('reacao', reacoes);
    sala.reagir(ana.id, '🔥');
    sala.reagir(ana.id, '🔥');
    vi.advanceTimersByTime(500);
    sala.reagir(ana.id, '😂');
    expect(reacoes).toHaveBeenCalledTimes(2);
  });
});
