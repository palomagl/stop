import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Endereço público do site, para a prévia do link: WhatsApp e redes só mostram a imagem
 * com o endereço completo. Na Vercel ele vem sozinho; em outro lugar, use VITE_SITE_URL.
 */
function enderecoDoSite(env: Record<string, string>): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return (env.VITE_SITE_URL || (vercel ? `https://${vercel}` : '')).replace(/\/+$/, '');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Sem o endereço do servidor, o site publicado ficaria esperando para sempre.
  if (mode === 'production' && !env.VITE_SERVER_URL) {
    console.warn('\n⚠️  VITE_SERVER_URL não definido: o site vai procurar o servidor em http://localhost:3333.\n');
  }
  const site = enderecoDoSite(env);

  return {
    plugins: [
      {
        name: 'previa-do-link',
        transformIndexHtml: {
          order: 'pre',
          handler: (html: string) => html.replaceAll('%ENDERECO_DO_SITE%', site),
        },
      },
      react(),
      tailwindcss(),
      // Instalação como app: manifesto, ícones e um service worker que guarda a "casca" do site.
      // O jogo em si precisa de internet; o cache só faz o app abrir rápido.
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Stopou! · Adedonha online',
          short_name: 'Stopou!',
          description: 'A adedonha online, em tempo real: sorteia a letra, todo mundo escreve e quem terminar primeiro grita STOP.',
          lang: 'pt-BR',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#0c1d68',
          theme_color: '#15309e',
          categories: ['games', 'education', 'entertainment'],
          icons: [
            { src: 'icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // Só as fontes do alfabeto latino; as outras escritas o português não usa.
          globIgnores: ['**/*cyrillic*', '**/*vietnamese*', '**/*greek*', '**/*devanagari*'],
          navigateFallback: '/index.html',
        },
      }),
    ],
    // host: true deixa abrir no celular pela rede de casa durante o desenvolvimento.
    server: { port: 5173, host: true },
    build: {
      rollupOptions: {
        output: {
          // Bibliotecas em arquivos separados: mudam pouco e ficam no cache do navegador.
          manualChunks: {
            react: ['react', 'react-dom'],
            animacao: ['framer-motion'],
            rede: ['socket.io-client'],
            validacao: ['zod'],
          },
        },
      },
    },
  };
});
