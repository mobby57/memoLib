import { test, expect } from './fixtures';

test.describe('Home Page', () => {
  test('should display home page', async ({ page }) => {
    await page.goto('/fr', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('MemoLib', { timeout: 3000 });
  });

  test('should display dashboard stats', async ({ page }) => {
    await page.goto('/fr', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Phase 9')).toBeVisible({ timeout: 3000 });
  });
});
