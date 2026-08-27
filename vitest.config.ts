import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // The interaction tests drive real user events through jsdom. The 5s
    // default is enough on an idle machine and not enough on a busy one, which
    // shows up as a flake rather than as the resource contention it is.
    testTimeout: 20_000,
  },
});
