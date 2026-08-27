import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * `preview.html` is the fixture-backed design preview. It is built only when
 * BUILD_PREVIEW is set — `npm run shot` does that — so it never reaches the
 * deployed site. It holds no credentials and cannot touch the database, but a
 * public page showing a fake band calendar would only confuse anyone who found
 * it.
 */
const includePreview = Boolean(process.env.BUILD_PREVIEW);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        ...(includePreview
          ? { preview: resolve(import.meta.dirname, 'preview.html') }
          : {}),
      },
    },
  },
});
