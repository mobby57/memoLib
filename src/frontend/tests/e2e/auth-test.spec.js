import { test, expect } from '@playwright/test';
import { loginForTests, isLoggedIn } from '../helpers/auth-simple.js';

test.describe('Test Auth Helper', () => {

  test('01 - Login comme nouvel utilisateur', async ({ page }) => {
    // Première utilisation
    await loginForTests(page, true);
    
    // Vérifier qu'on est sur la page d'accueil
    await expect(page).toHaveURL('/');
    
    // Vérifier qu'on est connecté
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    console.log('✅ Test nouvel utilisateur réussi');
  });

  test('02 - Login comme utilisateur existant', async ({ page }) => {
    // Compte existant
    await loginForTests(page, false);
    
    // Vérifier qu'on est sur la page d'accueil
    await expect(page).toHaveURL('/');
    
    // Vérifier qu'on est connecté
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
    
    console.log('✅ Test utilisateur existant réussi');
  });

  test('03 - Accès à /accessibility après login', async ({ page }) => {
    // Login
    await loginForTests(page, false);
    
    // Aller sur /accessibility
    await page.goto('/accessibility', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Vérifier qu'on n'a PAS été redirigé vers login
    const url = page.url();
    console.log(`URL finale: ${url}`);
    
    expect(url).toContain('/accessibility');
    expect(url).not.toContain('/login');
    
    // Prendre un screenshot
    await page.screenshot({ path: 'test-results/accessibility-after-login.png', fullPage: true });
    
    console.log('✅ Accès à /accessibility réussi après login');
  });
});
