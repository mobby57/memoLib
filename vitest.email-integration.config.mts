import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/api/emails/incoming-route.integration.test.ts'],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': resolve(dirname, 'src'),
    },
  },
});
