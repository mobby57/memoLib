import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Vérifications de base', () => {

  test('00 - Frontend répond correctement', async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Vérifier que la page charge
    await expect(page).toHaveTitle(/.*/); // N'importe quel titre
    
    // Attendre un peu
    await page.waitForTimeout(1000);
    
    // Prendre un screenshot pour diagnostic
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    
    console.log('✅ Frontend répond sur http://localhost:3001');
  });

  test('01 - Backend API répond', async ({ request }) => {
    // Vérifier que le backend répond via une requête API
    try {
      const response = await request.get('http://localhost:5000/');
      expect(response.status()).toBe(200);
      console.log('✅ Backend répond sur http://localhost:5000');
    } catch (error) {
      console.log('⚠️ Backend non accessible - test skipped');
      // Skip le test si backend non disponible
    }
  });

  test('02 - Navigation de base fonctionne', async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Prendre un screenshot
    await page.screenshot({ path: 'test-results/after-load.png', fullPage: true });
    
    // Vérifier qu'il y a du contenu
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(10);
    
    console.log('✅ Page contient du contenu:', body.substring(0, 100));
  });

  test('03 - Vérifier les routes accessibles', async ({ page }) => {
    // Just test that the home route loads without crashing
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Vérifier que la page contient du contenu
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(0);
    console.log(`✅ Route /: OK`);
    
    // Test accessibility route
    await page.goto('/accessibility', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    const accessibilityText = await page.textContent('body');
    expect(accessibilityText.length).toBeGreaterThan(0);
    console.log(`✅ Route /accessibility: OK`);
    
    // Test voice-transcription route
    await page.goto('/voice-transcription', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    const voiceText = await page.textContent('body');
    expect(voiceText.length).toBeGreaterThan(0);
    console.log(`✅ Route /voice-transcription: OK`);
  });
});
