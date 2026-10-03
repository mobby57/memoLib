import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Config Vitest dédiée aux tests de composants React (jsdom).
 * Usage: npx vitest run --config vitest.components.config.ts
 */
export default defineConfig({
  // @vitejs/plugin-react gere la transformation JSX independamment du tsconfig
  // (qui utilise `jsx: "preserve"`, requis et impose par Next.js).
  plugins: [react()],
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
