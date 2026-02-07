import { expect, test } from '@playwright/test';

test.describe('Client Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login en tant que client
    await page.goto('/');
    await page.fill('input[type="email"]', 'client@test.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should view assigned dossiers only', async ({ page }) => {
    await page.goto('/dossiers');

    // Client ne voit que ses dossiers
    await expect(page.locator('table tbody tr')).toBeVisible();

    // Pas de bouton créer (client ne peut pas créer)
    await expect(page.locator('button:has-text("Nouveau Dossier")')).not.toBeVisible();
  });

  test('should view dossier documents', async ({ page }) => {
    await page.goto('/dossiers');
    await page.click('table tbody tr:first-child a');

    // Voir onglet documents
    await page.click('button[role="tab"]:has-text("Documents")');

    // Télécharger documents
    await expect(page.locator('button:has-text("Télécharger")')).toBeVisible();
  });

  test('should send message to lawyer', async ({ page }) => {
    await page.goto('/messages');

    // Envoyer message
    await page.fill('input[placeholder*="message"]', 'Avez-vous des nouvelles ?');
    await page.click('button:has-text("Envoyer")');

    // Vérifier message affiché
    await page.waitForTimeout(1000);
    await expect(page.locator('text="Avez-vous des nouvelles ?"')).toBeVisible();
  });

  test('should view invoices', async ({ page }) => {
    await page.goto('/factures');

    // Client voit ses factures
    await expect(page.locator('table')).toBeVisible();

    // Peut télécharger
    await expect(page.locator('button:has-text("Télécharger")')).toBeVisible();
  });

  test('should pay invoice via Stripe', async ({ page }) => {
    await page.goto('/factures');
    await page.click('table tbody tr:first-child a');

    // Cliquer payer
    await page.click('button:has-text("Payer")');

    // Vérifier redirection Stripe
    await page.waitForURL(/.*stripe.com.*/);

    // Remplir formulaire Stripe (test mode)
    await page.fill('input[name="cardnumber"]', '4242424242424242');
    await page.fill('input[name="exp-date"]', '12/28');
    await page.fill('input[name="cvc"]', '123');

    await page.click('button[type="submit"]');

    // Vérifier retour et statut payé
    await page.waitForURL(/.*factures/);
    await expect(page.locator('span:has-text("paid")')).toBeVisible();
  });
});
