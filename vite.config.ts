import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        // The app.
        main: resolve(import.meta.dirname, 'index.html'),
        // The fixture-backed design preview. Imports nothing from src/data, so
        // it cannot reach the live project. Built alongside the app so design
        // fidelity stays checkable without a session.
        preview: resolve(import.meta.dirname, 'preview.html'),
      },
    },
  },
});
