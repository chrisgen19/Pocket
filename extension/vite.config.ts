import { fileURLToPath } from 'node:url';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(async ({ mode }) => {
  // Load `.env` into process.env so manifest.config.ts (dynamically imported
  // below) can read VITE_API_BASE_URL — Vite only exposes it via import.meta.env.
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_');
  if (env.VITE_API_BASE_URL) {
    process.env.VITE_API_BASE_URL = env.VITE_API_BASE_URL;
  }
  const { default: manifest } = await import('./manifest.config');

  return {
    plugins: [react(), tailwindcss(), crx({ manifest })],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: { port: 5173 },
      cors: {
        origin: [/^chrome-extension:\/\//],
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
