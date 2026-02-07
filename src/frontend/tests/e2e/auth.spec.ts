import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');

    // Vérifier présence des éléments de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login as avocat', async ({ page }) => {
    await page.goto('/');

    // Remplir formulaire
    await page.fill('input[type="email"]', 'avocat@test.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // Vérifier redirection vers dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Bienvenue');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Vérifier message d'erreur
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should logout', async ({ page }) => {
    // Login d'abord
    await page.goto('/');
    await page.fill('input[type="email"]', 'avocat@test.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // Attendre redirection
    await page.waitForURL(/.*dashboard/);

    // Déconnexion
    await page.click('button:has-text("Déconnexion")');

    // Vérifier retour login
    await expect(page).toHaveURL(/.*login/);
  });
});
