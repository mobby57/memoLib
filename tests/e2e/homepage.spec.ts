import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Page d'accueil
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/memoLib/i);
  });

  test('should have navigation links', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    // Support both NextAuth and localized login routes.
    const authLink = page
      .locator('a[href*="/api/auth/signin"], a[href$="/auth/login"], a[href*="/auth/login?"]')
      .first();
    await expect(authLink).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('nav')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have fast performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Doit charger en moins de 2 secondes
    expect(loadTime).toBeLessThan(2000);
  });

  test('should have meta tags for SEO', async ({ page }) => {
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  });
});
