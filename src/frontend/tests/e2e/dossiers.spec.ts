import { expect, test } from '@playwright/test';

test.describe('Dossiers CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login avant chaque test
    await page.goto('/');
    await page.fill('input[type="email"]', 'avocat@test.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should display dossiers list', async ({ page }) => {
    await page.goto('/dossiers');

    // Vérifier présence du tableau
    await expect(page.locator('h1')).toContainText('Dossiers');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('button:has-text("Nouveau Dossier")')).toBeVisible();
  });

  test('should create new dossier', async ({ page }) => {
    await page.goto('/dossiers');

    // Cliquer sur nouveau dossier
    await page.click('button:has-text("Nouveau Dossier")');

    // Vérifier redirection
    await expect(page).toHaveURL(/.*dossiers\/new/);

    // Remplir formulaire
    await page.fill('input[placeholder*="EX-"]', 'TEST-2026-001');
    await page.fill('input[placeholder*="ID du client"]', 'client-123');
    await page.fill('textarea[placeholder*="Description"]', 'Test dossier e2e');

    // Sélectionner statut
    await page.selectOption('select', 'open');

    // Soumettre
    await page.click('button:has-text("Créer le dossier")');

    // Vérifier redirection vers détail
    await page.waitForURL(/.*dossiers\/[a-z0-9]+/);
    await expect(page.locator('h1')).toContainText('TEST-2026-001');
  });

  test('should view dossier detail', async ({ page }) => {
    await page.goto('/dossiers');

    // Cliquer sur premier dossier
    await page.click('table tbody tr:first-child button:has-text("Voir")');

    // Vérifier détails
    await expect(page).toHaveURL(/.*dossiers\/[a-z0-9]+/);
    await expect(page.locator('h1')).toBeVisible();

    // Vérifier onglets
    await expect(page.locator('button[role="tab"]:has-text("Documents")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Délais")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Messages")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Factures")')).toBeVisible();
  });

  test('should update dossier', async ({ page }) => {
    await page.goto('/dossiers');
    await page.click('table tbody tr:first-child button:has-text("Voir")');

    // Activer mode édition
    await page.click('button:has-text("Modifier")');

    // Modifier description
    await page.fill('textarea[value*=""]', 'Description modifiée');

    // Sauvegarder
    await page.click('button:has-text("Enregistrer")');

    // Vérifier toast ou message
    await expect(page.locator('textarea')).toHaveValue(/Description modifiée/);
  });

  test('should delete dossier', async ({ page }) => {
    await page.goto('/dossiers');

    // Compter dossiers avant
    const countBefore = await page.locator('table tbody tr').count();

    // Supprimer premier dossier
    page.on('dialog', dialog => dialog.accept()); // Confirmer
    await page.click('table tbody tr:first-child button:has-text("Supprimer")');

    // Attendre mise à jour
    await page.waitForTimeout(1000);

    // Vérifier nombre réduit
    const countAfter = await page.locator('table tbody tr').count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test('should search dossiers', async ({ page }) => {
    await page.goto('/dossiers');

    // Rechercher
    await page.fill('input[placeholder*="Rechercher"]', 'TEST');
    await page.press('input[placeholder*="Rechercher"]', 'Enter');

    // Vérifier résultats
    await page.waitForTimeout(1000);
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should filter by status', async ({ page }) => {
    await page.goto('/dossiers');

    // Filtrer par statut
    await page.selectOption('select', 'open');

    // Vérifier résultats filtrés
    await page.waitForTimeout(1000);
    const rows = page.locator('table tbody tr');

    // Tous doivent avoir statut "open"
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('span:has-text("open")')).toBeVisible();
    }
  });
});
