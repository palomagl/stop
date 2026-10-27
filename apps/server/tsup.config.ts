import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node20',
  clean: true,
  // O pacote shared é TypeScript puro dentro do monorepo, então vai junto no arquivo final.
  noExternal: ['@rabisco/shared'],
});
