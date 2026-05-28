import { test, expect } from '@playwright/test';

const BASE = 'https://memolib.space';
const EMAIL = 'avocat@memolib.fr';
const PASSWORD = 'demo123';

test.describe('🔥 Smoke Test Production - memolib.space', () => {
  test('Flow complet: Login → Dashboard → IA → Dossier → Document', async ({ page }) => {
    test.setTimeout(60000);

    // 1. LOGIN
    console.log('🔐 1/6 Login...');
    await page.goto(`${BASE}/fr/auth/login`);
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    console.log('✅ Login OK - Dashboard atteint');

    // 2. DASHBOARD - vérifier qu'il charge sans "Accès non autorisé"
    console.log('📊 2/6 Dashboard...');
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('Accès non autorise');
    const hasGreeting = await page.locator('text=/Bonjour|Bon après-midi|Bonsoir/').isVisible({ timeout: 5000 }).catch(() => false);
    const hasWelcome = await page.locator('h1').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasGreeting || hasWelcome).toBeTruthy();
    console.log('✅ Dashboard OK');

    // 3. API IA - Résumé email
    console.log('🤖 3/6 Résumé IA...');
    const aiRes = await page.request.post(`${BASE}/api/ai/summarize-email`, {
      data: {
        subject: 'URGENT - OQTF reçue ce matin',
        body: 'Maître, je suis M. Ahmed Benali. J\'ai reçu une OQTF ce matin avec un délai de 30 jours. Mon numéro étranger est 1234567890. Merci de me rappeler au 06 12 34 56 78.',
        from: 'Ahmed Benali <ahmed.benali@gmail.com>',
      },
    });
    expect(aiRes.ok()).toBeTruthy();
    const aiData = await aiRes.json();
    expect(aiData.urgence).toBeDefined();
    expect(aiData.typeDossier).toBeDefined();
    console.log(`✅ IA OK → urgence: ${aiData.urgence}, type: ${aiData.typeDossier}, client: ${aiData.client}`);

    // 4. API - Création dossier depuis email
    console.log('📁 4/6 Création dossier...');
    const dossierRes = await page.request.post(`${BASE}/api/emails/create-dossier`, {
      data: {
        emailId: null,
        summary: {
          client: 'Ahmed Benali',
          objet: 'Contestation OQTF',
          urgence: 'critique',
          actionRequise: 'Déposer recours sous 30 jours',
          deadlineDetectee: '14/06/2026',
          typeDossier: 'OQTF',
          resumeCourt: 'Client a reçu OQTF, délai 30 jours pour recours.',
        },
      },
    });
    expect(dossierRes.ok()).toBeTruthy();
    const dossierData = await dossierRes.json();
    expect(dossierData.success).toBe(true);
    expect(dossierData.numero).toMatch(/^D-\d{4}-\d{4}$/);
    console.log(`✅ Dossier créé → ${dossierData.numero}`);

    // 5. API - Génération document juridique
    console.log('📄 5/6 Génération document...');
    const docRes = await page.request.post(`${BASE}/api/documents/generate`, {
      data: {
        templateType: 'recours_gracieux',
        variables: {
          destinataire: 'M. le Préfet',
          objet: 'Recours gracieux contre OQTF',
          client: 'M. Ahmed Benali',
          numeroDossier: dossierData.numero,
          dateDecision: '14 mai 2026',
        },
      },
    });
    expect(docRes.ok()).toBeTruthy();
    const docData = await docRes.json();
    expect(docData.content).toBeDefined();
    expect(docData.content.length).toBeGreaterThan(100);
    console.log(`✅ Document généré (${docData.content.length} chars)`);

    // 6. Navigation pages principales
    console.log('🧭 6/6 Navigation...');
    await page.goto(`${BASE}/fr/dossiers`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(await page.locator('body').textContent()).not.toContain('Accès non autorise');
    console.log('✅ Page dossiers OK');

    await page.goto(`${BASE}/fr/emails`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    expect(await page.locator('body').textContent()).not.toContain('Accès non autorise');
    console.log('✅ Page emails OK');

    console.log('\n🎉 TOUS LES TESTS PASSENT — PRÊT POUR DÉMO AVOCAT');
  });
});
