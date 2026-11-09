import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Config Vitest dédiée aux tests de composants React (jsdom).
 * Usage: npx vitest run --config vitest.components.config.ts
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/components/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/components/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(dirname, 'src'),
    },
  },
});
