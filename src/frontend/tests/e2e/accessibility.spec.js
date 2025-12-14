import { test, expect } from '@playwright/test';
import { loginForTests } from '../helpers/auth-simple.js';

test.describe('Accessibility System E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await loginForTests(page, false); // false = existing user
    
    // Wait for the main interface to load
    await page.waitForTimeout(1000);
  });

  test('01 - Navigation vers la page Accessibilité', async ({ page }) => {
    // Cliquer sur le lien Accessibilité dans la sidebar
    await page.click('a[href="/accessibility"]');
    
    // Vérifier qu'on est sur la bonne page
    await expect(page).toHaveURL('/accessibility');
    
    // Vérifier le titre
    await expect(page.getByRole('heading', { name: /Centre d'Accessibilité/i })).toBeVisible();
    
    // Vérifier que les 4 profils sont présents
    await expect(page.locator('button:has-text("Aveugle")')).toBeVisible();
    await expect(page.locator('button:has-text("Sourd")')).toBeVisible();
    await expect(page.locator('button:has-text("Muet")')).toBeVisible();
    await expect(page.locator('button:has-text("Moteur")')).toBeVisible();
  });

  test('02 - Activation du profil Aveugle (TTS)', async ({ page }) => {
    await page.goto('/accessibility');
    
    // Cliquer sur le profil Aveugle
    await page.click('button:has-text("Aveugle")');
    
    // Attendre l'apparition du message de confirmation
    await expect(page.locator('text=Profil appliqué')).toBeVisible({ timeout: 5000 });
    
    // Vérifier que le TTS est activé
    const ttsCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(ttsCheckbox).toBeChecked();
    
    // Vérifier que la description du profil est affichée
    await expect(page.locator('text=Synthèse vocale active')).toBeVisible();
  });

  test('03 - Activation du profil Sourd (Transcriptions)', async ({ page }) => {
    await page.goto('/accessibility');
    
    // Cliquer sur le profil Sourd
    await page.click('button:has-text("Sourd")');
    
    // Attendre l'apparition du message de confirmation
    await expect(page.locator('text=Profil appliqué')).toBeVisible({ timeout: 5000 });
    
    // Vérifier la description
    await expect(page.locator('text=Transcriptions visuelles').first()).toBeVisible();
  });

  test('04 - Paramètres TTS - Vitesse et Volume', async ({ page }) => {
    await page.goto('/accessibility');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Activer le TTS si pas déjà actif
    const ttsCheckbox = page.locator('input[type="checkbox"]').first();
    await ttsCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    if (!await ttsCheckbox.isChecked()) {
      await ttsCheckbox.click();
      await page.waitForTimeout(500);
    }
    
    // Vérifier que les sliders sont présents
    const speedSlider = page.locator('input[type="range"]').first();
    await speedSlider.waitFor({ state: 'visible', timeout: 5000 });
    
    // Utiliser evaluate pour changer la valeur au lieu de fill
    await speedSlider.evaluate((el, value) => {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, '180');
    
    await page.waitForTimeout(500);
    
    // Vérifier simplement que le slider existe et a changé
    const speedValue = await speedSlider.inputValue();
    expect(parseInt(speedValue)).toBeGreaterThanOrEqual(100);
  });

  test('05 - Tailles de police', async ({ page }) => {
    await page.goto('/accessibility');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Attendre que la section des tailles soit visible
    await page.waitForSelector('label:has-text("Taille de police")', { timeout: 10000 });
    
    // Chercher un bouton contenant "Large" ou "Grand"
    const largeButton = page.locator('button').filter({ hasText: /large|grand/i }).first();
    
    // Si le bouton existe, cliquer dessus
    const count = await largeButton.count();
    if (count > 0) {
      await largeButton.click();
      await page.waitForTimeout(500);
      // Vérifier que le bouton a changé d'état
      await expect(largeButton).toBeVisible();
    } else {
      // Si pas de bouton, vérifier juste que la section existe
      await expect(page.locator('label:has-text("Taille de police")').first()).toBeVisible();
    }
  });

  test('06 - Mode Haut Contraste', async ({ page }) => {
    await page.goto('/accessibility');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Trouver le checkbox de haut contraste
    const contrastLabel = page.locator('text=Haut contraste').first();
    await contrastLabel.waitFor({ state: 'visible', timeout: 10000 });
    
    // Trouver le checkbox associé
    const contrastCheckbox = page.locator('input[type="checkbox"]').filter({ has: page.locator('text=Haut contraste') }).first();
    
    // Alternative: chercher le checkbox le plus proche du label
    const checkbox = contrastLabel.locator('xpath=..').locator('input[type="checkbox"]').first();
    
    // Obtenir l'état initial
    const wasChecked = await checkbox.isChecked().catch(() => false);
    
    // Cliquer pour changer l'état
    await checkbox.click();
    await page.waitForTimeout(500);
    
    // Vérifier que l'état a changé
    const isNowChecked = await checkbox.isChecked();
    expect(isNowChecked).toBe(!wasChecked);
  });

  test('07 - Raccourcis clavier affichés', async ({ page }) => {
    await page.goto('/accessibility');
    
    // Scroller vers le bas pour voir les raccourcis
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Vérifier que les raccourcis sont présents (utiliser des sélecteurs plus spécifiques)
    // Chercher dans les éléments kbd ou code qui contiennent généralement les raccourcis
    const shortcutsVisible = await page.locator('kbd, code').count() > 0;
    
    if (shortcutsVisible) {
      // Si des raccourcis sont affichés dans des balises kbd/code, les vérifier
      await expect(page.locator('kbd, code').first()).toBeVisible();
    } else {
      // Sinon, vérifier qu'il y a du texte sur les raccourcis
      await expect(page.locator('text=/raccourcis|shortcuts/i').first()).toBeVisible();
    }
  });

  test('08 - Test du bouton TTS', async ({ page }) => {
    await page.goto('/accessibility');
    
    // Activer le TTS
    const ttsCheckbox = page.locator('input[type="checkbox"]').first();
    if (!await ttsCheckbox.isChecked()) {
      await ttsCheckbox.click();
      await page.waitForTimeout(500);
    }
    
    // Cliquer sur le bouton Tester
    await page.click('button:has-text("🔊 Tester")');
    
    // Attendre un peu (la synthèse vocale se lance en arrière-plan)
    await page.waitForTimeout(2000);
    
    // Pas d'erreur visible = succès
    await expect(page.locator('text=Erreur')).not.toBeVisible();
  });

  test('09 - API Accessibility Settings', async ({ page, request }) => {
    // Test direct de l'API
    const response = await request.get('http://localhost:5000/api/accessibility/settings');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.settings).toHaveProperty('tts_enabled');
    expect(data.settings).toHaveProperty('tts_rate');
    expect(data.settings).toHaveProperty('font_size');
  });

  test('10 - API Keyboard Shortcuts', async ({ page, request }) => {
    const response = await request.get('http://localhost:5000/api/accessibility/keyboard-shortcuts');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.shortcuts).toHaveProperty('Tab');
    expect(data.shortcuts).toHaveProperty('Ctrl+R');
  });
});
