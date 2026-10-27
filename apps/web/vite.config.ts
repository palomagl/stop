import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Instalação como app: manifesto, ícones e um service worker que guarda a "casca" do site.
    // O jogo em si precisa de internet; o cache só faz o app abrir rápido.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Rabisco · Stop online',
        short_name: 'Rabisco',
        description: 'O Stop (adedonha) do caderno, agora online e em tempo real.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fdfbf3',
        theme_color: '#fdfbf3',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Só as fontes do alfabeto latino; as outras escritas o português não usa.
        globIgnores: ['**/*cyrillic*', '**/*vietnamese*', '**/*greek*'],
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
});
