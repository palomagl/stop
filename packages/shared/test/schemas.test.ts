import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO, TOTAL_AVATARES } from '../src/constantes';
import { contemPalavrao } from '../src/palavroes';
import { apelidoSchema, avatarSchema, codigoSchema, configSchema, esquemasCliente } from '../src/schemas';

describe('apelido', () => {
  it('aceita e arruma espaços', () => {
    expect(apelidoSchema.parse('  Ana   Clara ')).toBe('Ana Clara');
  });

  it('recusa vazio, longo demais e palavrão', () => {
    expect(apelidoSchema.safeParse('   ').success).toBe(false);
    expect(apelidoSchema.safeParse('a'.repeat(17)).success).toBe(false);
    expect(apelidoSchema.safeParse('Porra').success).toBe(false);
    expect(apelidoSchema.safeParse('xXcaralhoXx').success).toBe(false);
  });

  it('não confunde nomes comuns com palavrão', () => {
    for (const nome of ['Paulo', 'Computador', 'Bichano', 'Disputas', 'Cuca', 'Esmeralda']) {
      expect(contemPalavrao(nome), nome).toBe(false);
    }
  });
});

describe('código da sala', () => {
  it('aceita minúsculas e espaços nas pontas', () => {
    expect(codigoSchema.parse(' gatos ')).toBe('GATOS');
  });

  it('recusa tamanho errado e números', () => {
    expect(codigoSchema.safeParse('GATO').success).toBe(false);
    expect(codigoSchema.safeParse('GAT0S').success).toBe(false);
  });
});

describe('config', () => {
  it('aceita a config padrão', () => {
    expect(configSchema.safeParse(CONFIG_PADRAO).success).toBe(true);
  });

  it('recusa categorias repetidas, mesmo com acento diferente', () => {
    const r = configSchema.safeParse({ ...CONFIG_PADRAO, categorias: ['Profissão', 'profissao'] });
    expect(r.success).toBe(false);
  });

  it('recusa quando sobram menos letras do que rodadas', () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTU'.split('');
    const r = configSchema.safeParse({ ...CONFIG_PADRAO, rodadas: 6, letrasExcluidas: letras });
    expect(r.success).toBe(false);
  });

  it('recusa tempo fora do limite', () => {
    expect(configSchema.safeParse({ ...CONFIG_PADRAO, tempoRodadaSeg: 5 }).success).toBe(false);
  });
});

describe('eventos', () => {
  it('recusa resposta com mais de 30 caracteres', () => {
    const r = esquemasCliente['resposta:rascunho'].safeParse({ categoria: 'Nome', texto: 'a'.repeat(31) });
    expect(r.success).toBe(false);
  });

  it('recusa reação fora da lista', () => {
    expect(esquemasCliente['reacao:enviar'].safeParse({ emoji: '💩' }).success).toBe(false);
  });
});


describe('personagens das três coleções', () => {
  it('aceita os IDs antigos e os novos e recusa fora do catálogo', () => {
    expect(TOTAL_AVATARES).toBe(84);
    for (let avatar = 0; avatar < 84; avatar++) expect(avatarSchema.safeParse(avatar).success).toBe(true);
    for (const avatar of [-1, 84, 0.5]) expect(avatarSchema.safeParse(avatar).success).toBe(false);
  });
});
