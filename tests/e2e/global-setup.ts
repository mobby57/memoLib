import { clerkSetup } from '@clerk/testing/playwright';
import type { FullConfig } from '@playwright/test';

/**
 * Global setup Playwright.
 *
 * clerkSetup() récupère un Testing Token au démarrage de la suite, rendu
 * disponible pour tous les tests (bypass de la bot-protection Clerk). Nécessite
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_test_*) et CLERK_SECRET_KEY (sk_test_*).
 *
 * No-op si les clés Clerk sont absentes : les specs authentifiés sont alors
 * skippés côté test (pas d'échec bruyant en l'absence de secrets).
 */
async function globalSetup(_config: FullConfig) {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.warn(
      '[e2e] Clés Clerk absentes — clerkSetup() ignoré (flow authentifié skippé).'
    );
    return;
  }
  await clerkSetup();
}

export default globalSetup;
