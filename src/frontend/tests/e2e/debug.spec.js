import { test, expect } from '@playwright/test';

test.describe('Debug - Voir le contenu des pages', () => {

  test('Debug 01 - Page d accueil', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForSelector('#root > *', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/debug-homepage.png', fullPage: true });
    
    // Voir tous les liens
    const links = await page.locator('a').all();
    console.log(`\n📍 Trouvé ${links.length} liens sur la page:`);
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`  - ${text?.trim() || '(no text)'}: ${href}`);
    }
    
    // Voir tous les boutons
    const buttons = await page.locator('button').all();
    console.log(`\n🔘 Trouvé ${buttons.length} boutons sur la page:`);
    
    for (const button of buttons) {
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      console.log(`  - ${text?.trim() || '(no text)'} [type=${type}]`);
    }
  });

  test('Debug 02 - Page Accessibility directe', async ({ page }) => {
    await page.goto('/accessibility', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForSelector('#root > *', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/debug-accessibility.png', fullPage: true });
    
    // Voir le titre de la page
    const title = await page.title();
    console.log(`\n📄 Titre: ${title}`);
    
    // Voir l'URL finale
    const url = page.url();
    console.log(`📍 URL finale: ${url}`);
    
    // Voir le contenu texte principal
    const mainText = await page.locator('body').textContent();
    console.log(`\n📝 Contenu (premiers 500 chars):\n${mainText.substring(0, 500)}`);
    
    // Chercher les boutons de profil
    const profiles = ['Aveugle', 'Sourd', 'Muet'];
    for (const profile of profiles) {
      const exists = await page.locator(`button:has-text("${profile}")`).count() > 0;
      console.log(`  - Bouton "${profile}": ${exists ? '✅ Trouvé' : '❌ Manquant'}`);
    }
  });

  test('Debug 03 - Page Voice Transcription directe', async ({ page }) => {
    await page.goto('/voice-transcription', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForSelector('#root > *', { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/debug-voice-transcription.png', fullPage: true });
    
    // Voir l'URL finale
    const url = page.url();
    console.log(`\n📍 URL finale: ${url}`);
    
    // Voir si on a été redirigé vers login
    if (url.includes('/login')) {
      console.log('⚠️ REDIRIGÉ VERS LOGIN - Auth requise!');
    }
    
    // Voir le contenu
    const bodyText = await page.locator('body').textContent();
    console.log(`\n📝 Contenu (premiers 300 chars):\n${bodyText.substring(0, 300)}`);
  });
});
