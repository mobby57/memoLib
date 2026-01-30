import { test, expect } from '@playwright/test';

// Simple smoke test for Memolib homepage
test('homepage loads and shows Memolib title', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const title = page.locator('h1');
  await expect(title).toHaveText(/Memolib/i);
});
