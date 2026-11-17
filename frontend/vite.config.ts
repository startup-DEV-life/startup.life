import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: frontendRoot,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': process.env.STARTUP_API_URL || 'http://localhost:4000',
      '/socket.io': { target: process.env.STARTUP_API_URL || 'http://localhost:4000', ws: true },
    },
  },
  build: {
    outDir: resolve(frontendRoot, '../dist'),
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-vendor',
              test: /node_modules[\\/]three[\\/]/,
              minSize: 20_000,
              maxSize: 450_000,
              priority: 20,
            },
          ],
        },
      },
    },
  },
});
