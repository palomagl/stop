import { NOME_DO_JOGO } from '@rabisco/shared';
import { iniciarServidor } from './socket/servidor';

const porta = Number(process.env.PORT ?? 3333);
const origens = (process.env.ORIGENS_PERMITIDAS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const servidor = await iniciarServidor({ porta, origens });
console.log(`${NOME_DO_JOGO}: servidor ouvindo na porta ${servidor.porta}`);
if (!origens.length) console.log('ORIGENS_PERMITIDAS vazio: qualquer origem pode conectar (ok para desenvolvimento).');

for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, async () => {
    await servidor.fechar();
    process.exit(0);
  });
}
