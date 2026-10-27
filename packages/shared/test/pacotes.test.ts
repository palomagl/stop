import { describe, expect, it } from 'vitest';
import { CONFIG_PADRAO, MAX_CATEGORIA, MAX_CATEGORIAS } from '../src/constantes';
import { normalizar } from '../src/normalizar';
import { PACOTES, pacoteDasCategorias } from '../src/pacotes';
import { configSchema } from '../src/schemas';

describe('pacotes de categorias', () => {
  it('todo pacote passa na validação de configuração', () => {
    for (const pacote of PACOTES) {
      const r = configSchema.safeParse({ ...CONFIG_PADRAO, categorias: pacote.categorias });
      expect(r.success, pacote.nome).toBe(true);
      expect(pacote.categorias.length).toBeLessThanOrEqual(MAX_CATEGORIAS);
      expect(pacote.categorias.every((c) => c.length <= MAX_CATEGORIA)).toBe(true);
    }
  });

  it('ids e nomes não se repetem', () => {
    expect(new Set(PACOTES.map((p) => p.id)).size).toBe(PACOTES.length);
    expect(new Set(PACOTES.map((p) => normalizar(p.nome))).size).toBe(PACOTES.length);
  });

  it('reconhece o pacote mesmo com outra ordem e outro acento', () => {
    expect(pacoteDasCategorias(['objeto', 'Cor', 'Animal', 'Fruta/Verdura/Legume', 'Nome'])?.id).toBe('rapidinho');
    expect(pacoteDasCategorias(CONFIG_PADRAO.categorias)?.id).toBe('classico');
  });

  it('não reconhece lista mexida', () => {
    expect(pacoteDasCategorias(['Nome', 'Animal'])).toBeUndefined();
  });
});
