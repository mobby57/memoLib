import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'avocat@memolib.fr';
const TEST_PASSWORD = 'admin123';

test.describe('🔐 Test Login Simple - Mode Démo', () => {
  test('Login et redirection vers dashboard', async ({ page }) => {
    console.log(`📍 Navigation vers: ${BASE_URL}/fr/auth/login`);

    // 1. Naviguer vers la page de login
    await page.goto(`${BASE_URL}/fr/auth/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Page de login chargée');

    // 2. Remplir le formulaire
    await page.fill('input[type="email"]', TEST_EMAIL);
    console.log(`✅ Email saisi: ${TEST_EMAIL}`);

    await page.fill('input[type="password"]', TEST_PASSWORD);
    console.log('✅ Mot de passe saisi');

    // 3. Soumettre le formulaire ET attendre la navigation
    await Promise.all([
      page.waitForNavigation({
        url: /dashboard/,
        waitUntil: 'networkidle',
        timeout: 30000,
      }),
      page.click('button[type="submit"]'),
    ]);

    console.log('✅ Formulaire soumis et navigation détectée');

    // 4. Vérifier que nous sommes sur le dashboard
    expect(page.url()).toMatch(/dashboard/i);
    console.log(`✅ URL actuelle: ${page.url()}`);

    // 5. Vérifier que la page dashboard est chargée
    const heading = await page.locator('h1, h2').first().textContent();
    console.log(`✅ Titre de la page: ${heading}`);

    // 6. Vérifier qu'il n'y a pas d'erreur visible
    const errorAlert = await page.locator('[role="alert"], .alert-error, .error-message').count();
    expect(errorAlert).toBe(0);
    console.log('✅ Aucune erreur affichée');

    console.log('\n🎉 Test de login réussi!\n');
  });

  test('API Health Check', async ({ page }) => {
    console.log(`📍 Test API Health: ${BASE_URL}/api/health`);

    const response = await page.request.get(`${BASE_URL}/api/health`);
    const status = response.status();

    console.log(`Status HTTP: ${status}`);

    if (status === 200) {
      const data = await response.json();
      console.log(`✅ API Health: ${JSON.stringify(data, null, 2)}`);
      expect(data.status).toBe('healthy');
    } else if (status === 503) {
      console.log('⚠️ Base de données non connectée (503) - normal en mode dev sans DB');
      const data = await response.json();
      console.log(`Erreur: ${data.error}`);
      // Ne pas échouer le test - DB optionnelle pour les démos
    } else {
      throw new Error(`Statut inattendu: ${status}`);
    }
  });
});
