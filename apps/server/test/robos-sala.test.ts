import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DURACOES, MAX_ROBOS, type Config, type NivelRobo } from '@rabisco/shared';
import type { PartidaTerminada } from '../src/arquivo/tipos';
import { Sala, type Jogador } from '../src/jogo/sala';
import type { Cerebro } from '../src/robos/cerebro';
import { ControleDeRobos } from '../src/robos/controle';
import { PREFIXO_ROBO } from '../src/robos/nomes';
import { CerebroDePalavras } from '../src/robos/palavras';

const CONFIG: Config = {
  categorias: ['Nome', 'Animal', 'Cor'],
  rodadas: 1,
  tempoRodadaSeg: 90,
  letrasExcluidas: ['K', 'W', 'Y', 'X', 'Q'],
  publica: false,
};

/** Um cérebro de mentira: sempre as mesmas ideias, e "Abacaxi" nunca vale como animal. */
function cerebroFalso(): Cerebro & { pensou: number } {
  return {
    pensou: 0,
    async pensar(_letra, categorias) {
      this.pensou++;
      return categorias.map((c) => (c === 'Nome' ? ['Ana', 'Alice', 'André'] : c === 'Animal' ? ['Abelha', 'Anta'] : ['Azul', 'Âmbar']));
    },
    async julgar(_letra, respostas) {
      return respostas.map((r) => !(r.categoria === 'Animal' && r.texto === 'Abacaxi'));
    },
    situacao: () => ({ ia: false }),
  };
}

/** A pessoa (Ana) e a sala com o controle dos robôs. A letra sorteada é sempre A. */
function salaComRobos(niveis: NivelRobo[], cerebro: Cerebro = cerebroFalso()) {
  const sala = new Sala('ROBOS', { duracoes: DURACOES, aleatorio: () => 0 });
  // 0,5 fixo: o robô não trava, não erra de propósito e vota quando sabe.
  new ControleDeRobos(sala, cerebro, () => 0.5);
  const ana = sala.adicionarJogador('Ana', 0, 'aparelho-ana') as Jogador;
  sala.conectar(ana, 'socket-ana');
  sala.configurar(ana.id, CONFIG);
  for (const nivel of niveis) expect(sala.adicionarRobo(ana.id, nivel)).toBeNull();
  const robos = sala.robos();
  return { sala, ana, robos };
}

async function passar(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
}

/** Passa o tempo de segundo em segundo até a sala chegar na fase. */
async function esperarFase(sala: Sala, fase: Sala['fase']) {
  for (let s = 0; s < 120 && sala.fase !== fase; s++) await passar(1000);
  expect(sala.fase).toBe(fase);
}

describe('robôs na sala', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('o robô chega pronto, com apelido e bicho que ninguém usa', () => {
    const { sala, ana, robos } = salaComRobos(['medio', 'dificil']);
    expect(robos).toHaveLength(2);
    expect(new Set(robos.map((r) => r.apelido)).size).toBe(2);
    expect(robos.every((r) => r.pronto && r.online && r.avatar !== ana.avatar)).toBe(true);
    expect(robos.every((r) => r.dispositivo.startsWith(PREFIXO_ROBO))).toBe(true);
    const visto = sala.estadoPara(ana.id).jogadores;
    expect(visto.find((j) => j.id === ana.id)!.robo).toBeNull();
    expect(visto.filter((j) => j.robo).map((j) => j.robo)).toEqual(['medio', 'dificil']);
  });

  it('só quem é dono chama robô, só no lobby e até o limite', () => {
    const { sala, ana } = salaComRobos([]);
    const bia = sala.adicionarJogador('Bia', 1, 'aparelho-bia') as Jogador;
    expect(sala.adicionarRobo(bia.id, 'facil')).toMatch(/dono/);
    for (let i = 0; i < MAX_ROBOS; i++) expect(sala.adicionarRobo(ana.id, 'facil')).toBeNull();
    expect(sala.adicionarRobo(ana.id, 'facil')).toMatch(/até 5 robôs/);
  });

  it('dá para começar só a pessoa e um robô', () => {
    const { sala, ana } = salaComRobos(['facil']);
    expect(sala.iniciar(ana.id)).toBeNull();
    expect(sala.fase).toBe('sorteio');
  });

  it('pensa uma vez por rodada, durante o sorteio, mesmo com vários robôs', async () => {
    const cerebro = cerebroFalso();
    const { sala, ana } = salaComRobos(['facil', 'medio', 'dificil'], cerebro);
    sala.iniciar(ana.id);
    expect(cerebro.pensou).toBe(1);
    await passar(DURACOES.sorteio);
    expect(cerebro.pensou).toBe(1);
  });

  it('escreve aos poucos, como gente, e o difícil aperta STOP quando termina', async () => {
    const { sala, ana, robos } = salaComRobos(['dificil']);
    const robo = robos[0]!;
    const preenchidas = () => sala.estadoPara(ana.id).jogadores.find((j) => j.id === robo.id)!.preenchidas;

    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio);
    expect(sala.fase).toBe('respostas');
    await passar(2000);
    expect(preenchidas()).toBe(0);
    await passar(8000);
    expect(preenchidas()).toBeGreaterThanOrEqual(1);
    expect(preenchidas()).toBeLessThan(3);

    await passar(30_000);
    expect(preenchidas()).toBe(3);
    expect(sala.stopPor).toBe(robo.id);
    expect(['Ana', 'Alice', 'André']).toContain(robo.respostas.get('Nome'));
  });

  it('vota contra o que não vale, a favor do que vale, e fica pronto', async () => {
    const { sala, ana, robos } = salaComRobos(['dificil', 'dificil']);
    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio);
    sala.rascunho(ana.id, 'Nome', 'Amanda');
    sala.rascunho(ana.id, 'Animal', 'Abacaxi');
    sala.rascunho(ana.id, 'Cor', 'Amarelo');
    // O robô difícil aperta STOP sozinho quando termina.
    await esperarFase(sala, 'correcao');

    const votosNaAna = () =>
      sala.estadoPara(ana.id).correcao!.respostas.find((r) => r.jogadorId === ana.id)!.votos;
    await passar(15_000);
    expect(Object.values(votosNaAna())).toEqual(['sim', 'sim']);
    expect(sala.estadoPara(ana.id).correcao!.prontos.sort()).toEqual(robos.map((r) => r.id).sort());

    // Os robôs já estão prontos: quando a Ana aperta "Pronto", a correção anda.
    sala.prontoCorrecao(ana.id, 0);
    expect(sala.estadoPara(ana.id).correcao!.categoria).toBe('Animal');
    await passar(15_000);
    expect(Object.values(votosNaAna())).toEqual(['nao', 'nao']);
  });

  it('se a pessoa já está pronta, os robôs não seguram a turma', async () => {
    const { sala, ana } = salaComRobos(['facil']);
    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio);
    sala.stop(ana.id, { Nome: 'Amanda', Animal: 'Abelha', Cor: 'Azul' });
    await passar(DURACOES.trava + 100);
    expect(sala.fase).toBe('correcao');
    sala.prontoCorrecao(ana.id, 0);
    await passar(1500);
    expect(sala.estadoPara(ana.id).correcao!.indice).toBe(1);
  });

  it('joga a partida inteira e ela vai para o histórico, com o robô marcado', async () => {
    const { sala, ana } = salaComRobos(['medio']);
    const terminadas: PartidaTerminada[] = [];
    sala.on('terminou', (p) => terminadas.push(p));
    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio + 90_000 + DURACOES.folgaRespostas);
    for (let i = 0; i < CONFIG.categorias.length; i++) {
      expect(sala.fase).toBe('correcao');
      sala.prontoCorrecao(ana.id, i);
      await passar(1500);
    }
    expect(sala.fase).toBe('resultado');
    sala.prontoResultado(ana.id, 1);
    await passar(1500);
    expect(sala.fase).toBe('fim');
    expect(terminadas).toHaveLength(1);
    expect(terminadas[0]!.jogadores.filter((j) => j.dispositivo.startsWith(PREFIXO_ROBO))).toHaveLength(1);
  });

  it('sem nenhuma pessoa online, os robôs não avançam a correção sozinhos', async () => {
    const { sala, ana } = salaComRobos(['dificil']);
    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio);
    sala.stop(ana.id, { Nome: 'Amanda', Animal: 'Abelha', Cor: 'Azul' });
    await passar(DURACOES.trava + 100);
    sala.desconectar(ana.id, 'socket-ana');
    await passar(15_000);
    expect(sala.estadoPara(ana.id).correcao!.indice).toBe(0);
    await passar(DURACOES.correcao);
    expect(sala.estadoPara(ana.id).correcao!.indice).toBe(1);
  });

  it('robô não segura a sala aberta: sem gente, ela fecha e os timers somem', async () => {
    const { sala, ana } = salaComRobos(['facil', 'dificil']);
    const vazia = vi.fn();
    sala.on('vazia', vazia);
    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio + 3000);
    sala.sair(ana.id);
    expect(vazia).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('quem não está online é só robô: a sala conta como abandonada', () => {
    const { sala, ana } = salaComRobos(['facil']);
    expect(sala.temAlguemOnline()).toBe(true);
    sala.desconectar(ana.id, 'socket-ana');
    expect(sala.temAlguemOnline()).toBe(false);
    expect(sala.semNinguemDesde).not.toBeNull();
  });

  it('robô não vota para pular letra e não pode ser denunciado', async () => {
    const { sala, ana, robos } = salaComRobos(['facil', 'facil']);
    sala.configurar(ana.id, { ...CONFIG, rodadas: 2, publica: true });
    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio);
    const letra = sala.letra;
    // A Ana é a única pessoa, então o voto dela já é a maioria.
    sala.votarPularLetra(ana.id);
    expect(sala.letra).not.toBe(letra);
    sala.denunciar(ana.id, robos[0]!.id);
    expect(sala.jogadores.has(robos[0]!.id)).toBe(true);
  });

  it('volta para a sala com o robô pronto, e dá para começar de novo', async () => {
    const { sala, ana } = salaComRobos(['medio']);
    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio + 90_000 + DURACOES.folgaRespostas);
    for (let i = 0; i < 3; i++) {
      sala.prontoCorrecao(ana.id, i);
      await passar(1500);
    }
    sala.prontoResultado(ana.id, 1);
    await passar(1500);
    expect(sala.jogarDeNovo(ana.id, true)).toBeNull();
    expect(sala.robos()[0]!.pronto).toBe(true);
    expect(sala.iniciar(ana.id)).toBeNull();
  });

  it('com a lista de palavras do jogo, o robô também joga', async () => {
    const { sala, ana, robos } = salaComRobos(['dificil'], new CerebroDePalavras());
    sala.iniciar(ana.id);
    await passar(DURACOES.sorteio + 60_000);
    expect(robos[0]!.respostas.size).toBe(3);
  });
});
