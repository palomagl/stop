import { describe, expect, it } from 'vitest';
import { chaveResposta, limparTexto, normalizar } from '../src/normalizar';

describe('normalizar', () => {
  it('tira acentos, maiúsculas e espaços extras', () => {
    expect(normalizar('  Ação   Pão ')).toBe('acao pao');
    expect(normalizar('MAÇÃ')).toBe('maca');
  });

  it('troca pontuação por espaço', () => {
    expect(normalizar('Guarda-chuva!')).toBe('guarda chuva');
  });

  it('limparTexto só arruma os espaços', () => {
    expect(limparTexto('  São    Paulo ')).toBe('São Paulo');
  });
});

describe('chaveResposta', () => {
  it('considera iguais respostas que só mudam acento e maiúscula', () => {
    expect(chaveResposta('Limão')).toBe(chaveResposta('limao'));
    expect(chaveResposta('ÔNIBUS')).toBe(chaveResposta('onibus'));
  });

  it('ignora plural simples', () => {
    expect(chaveResposta('Abacaxi')).toBe(chaveResposta('abacaxis'));
    expect(chaveResposta('Bananas')).toBe(chaveResposta('banana'));
  });

  it('ignora espaços extras entre palavras', () => {
    expect(chaveResposta('Rio   de Janeiro')).toBe(chaveResposta('rio de janeiro'));
  });

  it('mantém palavras curtas terminadas em s', () => {
    expect(chaveResposta('gás')).toBe('gas');
  });

  it('não junta respostas diferentes', () => {
    expect(chaveResposta('Bola')).not.toBe(chaveResposta('Bolo'));
  });
});
