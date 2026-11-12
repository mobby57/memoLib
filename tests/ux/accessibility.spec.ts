import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibilité WCAG 2.1 AA', () => {
  const pages = ['/fr', '/fr/clients', '/fr/clients/nouveau'];

  for (const p of pages) {
    test(`pas de violation a11y sur ${p}`, async ({ page }, testInfo) => {

      test.setTimeout(60000);
      await page.goto(p);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('nextjs-portal')
        .exclude('iframe')
        .disableRules(['region'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});