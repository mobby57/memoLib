import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

process.env.CLERK_SECRET_KEY ??= 'test_clerk_secret_key';
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';

const dirname = fileURLToPath(new URL('.', import.meta.url));

// Tier d'intégration : tests qui frappent une vraie base de données / API externe.
// Exécuté séparément de test:ci (qui les exclut). Nécessite DATABASE_URL / clés API.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/integration/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30_000,
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      'server-only': resolve(dirname, 'src/test/mocks/server-only.ts'),
      '@': resolve(dirname, 'src'),
    },
  },
});
