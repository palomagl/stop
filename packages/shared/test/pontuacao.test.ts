import { describe, expect, it } from 'vitest';
import {
  anuladaPorVotos,
  calcularPosicoes,
  motivoAnulacaoAutomatica,
  pontuarCategoria,
} from '../src/pontuacao';

describe('motivoAnulacaoAutomatica', () => {
  it('aceita resposta que começa com a letra', () => {
    expect(motivoAnulacaoAutomatica('Abacaxi', 'A')).toBeNull();
    expect(motivoAnulacaoAutomatica('  água ', 'A')).toBeNull();
    expect(motivoAnulacaoAutomatica('Égua', 'E')).toBeNull();
  });

  it('anula resposta vazia ou só com espaços e pontuação', () => {
    expect(motivoAnulacaoAutomatica('', 'A')).toBe('vazia');
    expect(motivoAnulacaoAutomatica('   ', 'A')).toBe('vazia');
    expect(motivoAnulacaoAutomatica('...', 'A')).toBe('vazia');
  });

  it('anula resposta com a letra errada', () => {
    expect(motivoAnulacaoAutomatica('Banana', 'A')).toBe('letra');
  });

  it('anula resposta que é só a letra', () => {
    expect(motivoAnulacaoAutomatica('A', 'A')).toBe('so-letra');
    expect(motivoAnulacaoAutomatica('a.', 'A')).toBe('so-letra');
    expect(motivoAnulacaoAutomatica('Á', 'A')).toBe('so-letra');
  });
});

describe('anuladaPorVotos', () => {
  it('anula quando os 👎 são maioria', () => {
    expect(anuladaPorVotos({ a: 'nao', b: 'nao', c: 'sim' })).toBe(true);
  });

  it('mantém quando os 👍 são maioria', () => {
    expect(anuladaPorVotos({ a: 'sim', b: 'sim', c: 'nao' })).toBe(false);
  });

  it('mantém no empate e sem votos', () => {
    expect(anuladaPorVotos({ a: 'sim', b: 'nao' })).toBe(false);
    expect(anuladaPorVotos({})).toBe(false);
  });

  it('com dois jogadores, um 👎 basta', () => {
    expect(anuladaPorVotos({ a: 'nao' })).toBe(true);
  });
});

describe('pontuarCategoria', () => {
  it('dá 10 para resposta válida e única', () => {
    expect(
      pontuarCategoria([
        { jogadorId: 'a', texto: 'Abacaxi', anulada: false },
        { jogadorId: 'b', texto: 'Amora', anulada: false },
      ]),
    ).toEqual({ a: 10, b: 10 });
  });

  it('dá 5 para cada um quando a resposta se repete, mesmo com acento e plural diferentes', () => {
    expect(
      pontuarCategoria([
        { jogadorId: 'a', texto: 'Abacaxi', anulada: false },
        { jogadorId: 'b', texto: 'abacaxis', anulada: false },
        { jogadorId: 'c', texto: 'Açaí', anulada: false },
        { jogadorId: 'd', texto: 'acai', anulada: false },
        { jogadorId: 'e', texto: 'Amora', anulada: false },
      ]),
    ).toEqual({ a: 5, b: 5, c: 5, d: 5, e: 10 });
  });

  it('dá 0 para anulada, e a anulada não conta como repetição', () => {
    expect(
      pontuarCategoria([
        { jogadorId: 'a', texto: 'Abacaxi', anulada: false },
        { jogadorId: 'b', texto: 'Abacaxi', anulada: true },
        { jogadorId: 'c', texto: '', anulada: true },
      ]),
    ).toEqual({ a: 10, b: 0, c: 0 });
  });
});

describe('calcularPosicoes', () => {
  it('empatados dividem a posição', () => {
    expect(calcularPosicoes({ a: 30, b: 20, c: 20, d: 5 })).toEqual({ a: 1, b: 2, c: 2, d: 4 });
  });
});
