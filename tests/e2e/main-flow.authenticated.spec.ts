import { test, expect } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

/**
 * E2E — Flow authentifié MemoLib via Clerk (sign-in programmatique).
 *
 * Prérequis (fournis en CI / local avec DB Docker) :
 *   - @clerk/testing installé + clerkSetup() en global-setup (Testing Token).
 *   - Un compte de test Clerk (E2E_CLERK_EMAIL / E2E_CLERK_PASSWORD).
 *   - Un user MemoLib seedé avec le MÊME email (prisma/seed-e2e-user.ts),
 *     car l'auth mappe la session Clerk -> user local par email.
 *
 * Si les creds Clerk sont absents, la suite est skippée (pas d'échec bruyant).
 */

const EMAIL = process.env.E2E_CLERK_EMAIL;
const PASSWORD = process.env.E2E_CLERK_PASSWORD;
const clerkConfigured =
  Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && EMAIL && PASSWORD);

test.describe('Flow authentifié MemoLib (Clerk)', () => {
  test.skip(!clerkConfigured, 'Creds Clerk de test absents (E2E_CLERK_EMAIL/PASSWORD + clés).');

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto('/fr', { waitUntil: 'domcontentloaded' });
    // Attendre que le SDK Clerk soit prêt (pas 'networkidle' : la page garde des
    // connexions ouvertes — Clerk/analytics — et n'atteint jamais l'idle).
    await page.waitForFunction(() => (window as any).Clerk?.loaded === true, undefined, {
      timeout: 30000,
    });
    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: EMAIL!, password: PASSWORD! },
    });
    const resp = await page.goto('/fr/dashboard', { waitUntil: 'domcontentloaded', timeout: 25000 });
    // La route protégée répond 200 pour une requête authentifiée (pas de
    // redirection vers /sign-in), et l'URL reste sur le dashboard.
    expect(resp?.status(), 'dashboard status').toBeLessThan(400);
    expect(page.url()).toContain('/dashboard');
  });

  test('Dashboard accessible une fois authentifié (Clerk end-to-end)', async ({ page }) => {
    // La navigation authentifiée a chargé /fr/dashboard (200) dans le beforeEach.
    // On confirme qu'un contenu de tableau de bord est rendu (pas une redirection
    // vers /sign-in).
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).toBeVisible();
  });

  // NB — Les endpoints API authentifiés (summarize-email, create-dossier,
  // draft-reply) ne sont PAS testés ici via page.request : la session Clerk
  // établie par @clerk/testing vaut pour la NAVIGATION (le serveur voit la
  // session, /dashboard répond 200) mais window.Clerk.session côté client et le
  // contexte page.request n'héritent pas du token -> 401. Ces routes sont déjà
  // couvertes au niveau intégration (src/__tests__/api/ai/ai-guarantees.test.ts,
  // PR #29) : fallback, requiresHumanReview, no-auto-send. On évite ici un faux
  // rouge dû à une limite de plomberie Clerk/Playwright, pas à un bug applicatif.
});
