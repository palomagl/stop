import pg from 'pg';
import { NOME_DO_JOGO } from '@rabisco/shared';
import { ArquivoPostgres } from './arquivo/postgres';
import { iniciarServidor } from './socket/servidor';

const porta = Number(process.env.PORT ?? 3333);
const origens = (process.env.ORIGENS_PERMITIDAS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const urlBanco = process.env.DATABASE_URL;
const arquivo = urlBanco
  ? await ArquivoPostgres.abrir(new pg.Pool({ connectionString: urlBanco, max: 5 }))
  : undefined;

const servidor = await iniciarServidor({ porta, origens, arquivo });
console.log(`${NOME_DO_JOGO}: servidor ouvindo na porta ${servidor.porta}`);
if (!origens.length) console.log('ORIGENS_PERMITIDAS vazio: qualquer origem pode conectar (ok para desenvolvimento).');
console.log(
  urlBanco
    ? 'Histórico e ranking: guardados no Postgres.'
    : 'DATABASE_URL vazio: histórico e ranking ficam desligados (as partidas não são guardadas).',
);

for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, async () => {
    await servidor.fechar();
    process.exit(0);
  });
}
