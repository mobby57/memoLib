import { test, expect } from './fixtures';

test.describe('Factures', () => {
  test('should display factures page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/fr/factures', { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.locator('body')).toBeVisible({ timeout: 3000 });
  });
});
