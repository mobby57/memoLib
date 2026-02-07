import { test, expect } from './fixtures';

test.describe('Dossiers', () => {
  test('should display dossiers page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/fr/dossiers', { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.locator('h1')).toBeVisible({ timeout: 3000 });
  });
});
