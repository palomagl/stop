import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
