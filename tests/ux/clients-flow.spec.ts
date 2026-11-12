import { test, expect } from '@playwright/test';

test('parcours création client de bout en bout', async ({ page }, testInfo) => {

  await page.goto('/fr/clients');
  await page.getByRole('button', { name: /Nouveau client/i }).click();
  await expect(page.getByLabel(/prénom/i)).toBeVisible({ timeout: 5000 });

  await page.getByLabel(/prénom/i).fill('Test');
  await page.getByLabel('Nom', { exact: true }).fill('UX');
  await page.getByLabel(/email/i).fill(`test.${Date.now()}@example.com`);
  await page.getByLabel(/téléphone/i).fill('0612345678');

  await page.getByRole('button', { name: /^créer/i }).click({ force: true });
});