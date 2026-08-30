import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts', 'src/__tests__/**/*.test.{ts,tsx}'],
        exclude: [
            // React hooks/components → vitest.components.config.ts (jsdom)
            'src/__tests__/hooks/**/*.test.tsx',
            'src/__tests__/hooks/useAuth.test.ts',
            'src/__tests__/hooks/useToast.test.ts',
            'src/__tests__/hooks/usePerformance.test.tsx',
            'src/__tests__/hooks/useSessionTimeout.test.ts',
            'src/__tests__/components/**/*.test.tsx',
            // E2E / Integration DB → nécessitent serveur ou DB
            'src/__tests__/e2e/**',
            'src/__tests__/integration/saas-db.test.ts',
            'src/__tests__/api/webhooks/test-multichannel.e2e.test.ts',
            // Doublons (déjà dans tests/integration/)
            'src/__tests__/integration/legifrance-api.test.ts',
            // Tests d'intégration réseau (API Légifrance timeout)
            'tests/integration/legifrance-api.test.ts',
            // Tests avec mock @prisma/client constructeur (à migrer vers @/lib/prisma mock)
            'src/__tests__/api/factures.test.ts',
            'src/__tests__/api/legal-deadlines.test.ts',
            'src/__tests__/api/emails/incoming-route.integration.test.ts',
            'src/__tests__/api/emails/incoming-route.test.ts',
            'src/__tests__/api/auth/auth.test.ts',
            'src/__tests__/api/auth/register.test.ts',
            'src/__tests__/api/client/client.test.ts',
            'src/__tests__/lib/cron/deadline-alerts.test.ts',
            'src/__tests__/lib/auth/auth.test.ts',
            'src/__tests__/services/dossier.service.test.ts',
            'src/__tests__/lib/services/dossier.service.test.ts',
            'src/__tests__/security/audit-trail.test.ts',
            'src/__tests__/security/encryption.test.ts',
            'src/__tests__/services/suggestionService.test.ts',
            'src/__tests__/stripe/webhook-idempotency.test.ts',
            'src/__tests__/domain/e2e-encryption.test.ts',
            'src/__tests__/utils/error-utils.test.ts',
            'src/__tests__/lib/utils/utils.extended.test.ts',
        ],
    },
    resolve: {
        alias: {
            // Keep alias resolution aligned with tsconfig.json paths (@/* -> src/*)
            '@': resolve(dirname, 'src')
        }
    },
    coverage: {
        provider: 'v8',
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [
            'src/__tests__/**',
            'src/**/*.test.{ts,tsx}',
            'src/**/*.spec.{ts,tsx}',
            'src/**/*.d.ts',
            'src/app/**/layout.tsx',
            'src/app/**/loading.tsx',
            'src/lib/prisma.ts',
        ],
        reporter: ['text', 'text-summary', 'json-summary', 'lcov', 'clover'],
        thresholds: {
            branches: 65,
            functions: 80,
            lines: 75,
            statements: 75,
        },
    },
});
