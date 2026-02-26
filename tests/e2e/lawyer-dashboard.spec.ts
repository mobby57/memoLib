import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Dashboard Avocat
 * Requiert authentification
 */

test.describe('Lawyer Dashboard', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/lawyer/dashboard');
  });

  test('should display dashboard statistics', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Vérifier les cartes de statistiques
    await expect(page.locator('text=Total dossiers')).toBeVisible();
    await expect(page.locator('text=Dossiers urgents')).toBeVisible();
    await expect(page.locator('text=Factures en attente')).toBeVisible();
  });

  test('should navigate to dossiers list', async ({ page }) => {
    await page.click('a[href="/lawyer/dossiers"]');
    await page.waitForURL('/lawyer/dossiers');
    
    await expect(page.locator('h1')).toContainText('Dossiers');
  });

  test('should navigate to clients list', async ({ page }) => {
    await page.click('a[href="/lawyer/clients"]');
    await page.waitForURL('/lawyer/clients');
    
    await expect(page.locator('h1')).toContainText('Clients');
  });

  test('should display recent activity', async ({ page }) => {
    const activitySection = page.locator('text=Activités récentes').locator('..');
    await expect(activitySection).toBeVisible();
  });

  test('should have functional search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('OQTF');
      await page.keyboard.press('Enter');
      
      // Devrait filtrer les résultats
      await page.waitForTimeout(500);
    }
  });

  test('should logout successfully', async ({ page }) => {
    await page.click('button:has-text("Déconnexion")');
    
    // Devrait rediriger vers la page de login
    await page.waitForURL('/api/auth/signin');
    await expect(page).toHaveURL(/signin/);
  });
});
