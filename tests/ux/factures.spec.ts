import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Factures - /fr/factures', () => {
  test('page se charge sans erreur', async ({ page }) => {
    const response = await page.goto('/fr/factures');
    expect(response?.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle');
  });

  test('pas de violation a11y', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/fr/factures');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('nextjs-portal').exclude('iframe')
      .disableRules(['region'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('pas de scroll horizontal', async ({ page }) => {
    await page.goto('/fr/factures');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);
  });
});