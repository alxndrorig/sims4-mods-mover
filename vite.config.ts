import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'renderer',
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer/src')
    }
  },
  server: {
    port: 5173
  }
});
