import { defineConfig, devices } from '@playwright/test';

// Portas próprias para não brigar com o `npm run dev` aberto. Os testes sempre sobem os próprios
// servidores: reaproveitar um que já estivesse na porta poderia apontar para outro backend.
const PORTA_SERVIDOR = 3334;
const PORTA_WEB = 5174;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA_WEB}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'celular', use: { ...devices['Pixel 7'] } }],
  webServer: [
    {
      command: 'npm run dev -w @rabisco/server',
      env: { PORT: String(PORTA_SERVIDOR) },
      url: `http://localhost:${PORTA_SERVIDOR}/health`,
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -w @rabisco/web -- --port ${PORTA_WEB} --strictPort`,
      env: { VITE_SERVER_URL: `http://localhost:${PORTA_SERVIDOR}` },
      url: `http://localhost:${PORTA_WEB}`,
      reuseExistingServer: false,
    },
  ],
});
