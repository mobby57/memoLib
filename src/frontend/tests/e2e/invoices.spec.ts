import { expect, test } from '@playwright/test';

test.describe('Invoicing Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[type="email"]', 'avocat@test.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should display invoices list', async ({ page }) => {
    await page.goto('/factures');

    await expect(page.locator('h1')).toContainText('Factures');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('button:has-text("Nouvelle Facture")')).toBeVisible();
  });

  test('should create invoice', async ({ page }) => {
    await page.goto('/factures');
    await page.click('button:has-text("Nouvelle Facture")');

    // Remplir formulaire facture
    await expect(page).toHaveURL(/.*factures\/new/);

    await page.fill('input[placeholder*="Numéro"]', 'FAC-2026-001');
    await page.fill('input[type="number"]', '1000');
    await page.selectOption('select', 'draft');

    await page.click('button:has-text("Créer la facture")');

    // Vérifier création
    await page.waitForURL(/.*factures\/[a-z0-9]+/);
    await expect(page.locator('h1')).toContainText('FAC-2026-001');
  });

  test('should send invoice to client', async ({ page }) => {
    await page.goto('/factures');
    await page.click('table tbody tr:first-child a');

    // Envoyer facture
    await page.click('button:has-text("Envoyer au client")');

    // Vérifier changement statut
    await page.waitForTimeout(1000);
    await expect(page.locator('span:has-text("sent")')).toBeVisible();
  });

  test('should filter invoices by status', async ({ page }) => {
    await page.goto('/factures');

    // Filtrer par payé
    await page.selectOption('select', 'paid');

    await page.waitForTimeout(1000);

    // Vérifier tous sont payés
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('span:has-text("paid")')).toBeVisible();
    }
  });

  test('should download invoice PDF', async ({ page }) => {
    await page.goto('/factures');

    // Cliquer télécharger
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('table tbody tr:first-child button:has-text("Télécharger")'),
    ]);

    // Vérifier téléchargement
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
