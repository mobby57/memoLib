import { test, expect } from '@playwright/test';

/**
 * Test E2E du flow principal MemoLib:
 * Login → Dashboard → Email → Analyse IA → Création dossier → Timeline
 */

test.describe('Flow principal MemoLib', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@memolib.local');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
  });

  test('Dashboard affiche onboarding ou widgets', async ({ page }) => {
    // Vérifier que le dashboard charge
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });
    // Soit l'onboarding, soit le welcome banner
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
    expect(data.client).toContain('Dupont');
    expect(data.deadlineDetectee).toContain('15/06/2026');
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
    expect(data.content).toContain('Dupont');
    expect(data.content).toContain('Renouvellement');
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
    expect(data.tone).toBeDefined();
  });

  test('API recherche jurisprudence fonctionne', async ({ request }) => {
    const res = await request.get('/api/jurisprudence/search?q=OQTF');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results[0].titre).toBeDefined();
  });

  test('Landing page charge et formulaire fonctionne', async ({ page }) => {
    await page.goto('/landing');
    await expect(page.locator('h1')).toContainText('cabinet');
    await page.fill('input[type="email"]', 'test-e2e@example.com');
    await page.click('button:has-text("beta")');
    await expect(page.locator('text=Inscription reçue')).toBeVisible({ timeout: 5000 });
  });
});
