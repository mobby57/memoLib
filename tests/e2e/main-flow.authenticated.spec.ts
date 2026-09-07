import { test, expect } from '@playwright/test';

/**
 * E2E — Flow authentifié complet MemoLib (Login → Dashboard → IA → Dossier →
 * Document → Brouillon → Jurisprudence).
 *
 * ⚠️ test.describe.skip VOLONTAIRE.
 *
 * Ce flow exige un environnement que le CI local n'a pas :
 *   1. Une vraie session Clerk. Installer `@clerk/testing`, appeler `clerkSetup()`
 *      en global-setup, et `setupClerkTestingToken({ page })` avant navigation,
 *      avec un compte de test Clerk (CLERK_SECRET_KEY + NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).
 *   2. Une base seedée : l'auth mappe la session Clerk -> user local via
 *      `prisma.user.findUnique({ where: { email } })`. Il faut donc un user
 *      MemoLib (ex. admin@memolib.local) dont l'email == l'email du compte Clerk de test.
 *   3. Une IA disponible (Ollama local ou mock) pour les assertions de résumé/brouillon.
 *
 * POUR ACTIVER (en CI dédiée avec secrets) :
 *   1. npm i -D @clerk/testing
 *   2. global-setup Playwright : await clerkSetup();
 *   3. Remplacer le beforeEach ci-dessous par :
 *        await setupClerkTestingToken({ page });
 *        await page.goto('/fr/sign-in');
 *        // connexion via le compte de test Clerk (email + code/mot de passe de test)
 *   4. Seeder la DB (prisma/seed*.ts) avec l'utilisateur de test.
 *   5. Retirer le `.skip`.
 *
 * Les assertions ci-dessous sont conservées telles quelles (valeur de couverture
 * du flow métier) pour ne rien perdre du spec d'origine.
 */

const TEST_EMAIL = process.env.E2E_CLERK_EMAIL || 'admin@memolib.local';

test.describe.skip('Flow authentifié MemoLib (à activer avec Clerk + seed)', () => {
  test.beforeEach(async ({ page }) => {
    // TODO(clerk): setupClerkTestingToken({ page }) + connexion compte de test.
    await page.goto('/fr/sign-in');
    // Placeholder : la vraie connexion Clerk sera injectée ici.
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('Dashboard affiche onboarding ou widgets', async ({ page }) => {
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });
    const hasOnboarding = await page.locator('text=Bienvenue').isVisible().catch(() => false);
    const hasDashboard = await page.locator('text=Bonjour').isVisible().catch(() => false);
    expect(hasOnboarding || hasDashboard).toBeTruthy();
  });

  test('API résumé IA email fonctionne', async ({ request }) => {
    const res = await request.post('/api/ai/summarize-email', {
      data: {
        subject: 'Demande de titre de séjour urgent',
        body: 'Bonjour Maître, je suis M. Dupont. Mon récépissé expire le 15/06/2026. Pouvez-vous m\'aider pour le renouvellement ? C\'est urgent car je dois voyager.',
        from: 'Jean Dupont <jean.dupont@email.com>',
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.urgence).toBeDefined();
    expect(data.typeDossier).toBe('TITRE_SEJOUR');
  });

  test('API création dossier depuis email fonctionne', async ({ request }) => {
    const res = await request.post('/api/emails/create-dossier', {
      data: {
        emailId: null,
        summary: {
          client: 'Test Client E2E',
          objet: 'Renouvellement titre séjour',
          urgence: 'haute',
          actionRequise: 'Préparer dossier renouvellement',
          deadlineDetectee: '15/06/2026',
          typeDossier: 'TITRE_SEJOUR',
          resumeCourt: 'Client demande renouvellement titre de séjour avant expiration.',
        },
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.numero).toMatch(/^D-\d{4}-\d{4}$/);
    expect(data.dossierId).toBeDefined();
  });

  test('API génération document fonctionne', async ({ request }) => {
    const res = await request.post('/api/documents/generate', {
      data: {
        templateType: 'accuse_reception',
        variables: {
          destinataire: 'M. Jean Dupont',
          objet: 'Renouvellement titre de séjour',
          dateReception: '10 mai 2026',
        },
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.content).toContain('Accusé de réception');
  });

  test('API brouillon réponse email fonctionne', async ({ request }) => {
    const res = await request.post('/api/ai/draft-reply', {
      data: {
        subject: 'Question sur mon dossier',
        body: 'Bonjour, où en est mon dossier de naturalisation ?',
        from: 'Marie Martin <marie@test.com>',
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.subject).toContain('Re:');
    expect(data.body.length).toBeGreaterThan(50);
  });

  test('API recherche jurisprudence fonctionne', async ({ request }) => {
    const res = await request.get('/api/jurisprudence/search?q=OQTF');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.results.length).toBeGreaterThan(0);
  });

  test('Landing page charge et formulaire fonctionne', async ({ page }) => {
    await page.goto('/landing');
    await expect(page.locator('h1')).toContainText('cabinet');
    await page.fill('input[type="email"]', 'test-e2e@example.com');
    await page.click('button:has-text("beta")');
    await expect(page.locator('text=Inscription reçue')).toBeVisible({ timeout: 5000 });
  });

  // Référence : l'email du user local doit matcher le compte Clerk de test.
  test('config: email de test défini', async () => {
    expect(TEST_EMAIL).toBeTruthy();
  });
});
