import { expect, test } from '@playwright/test';

test.describe('SuperAdmin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login superadmin
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should view all tenants', async ({ page }) => {
    await page.goto('/admin/tenants');

    // Voir liste tenants
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Cabinets');
  });

  test('should view audit logs', async ({ page }) => {
    await page.goto('/admin/logs');

    // Voir logs
    await expect(page.locator('table')).toBeVisible();

    // Filtrer par action
    await page.selectOption('select', 'CREATE');
    await page.waitForTimeout(1000);

    // Vérifier filtrage
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('CREATE');
    }
  });

  test('should view system metrics', async ({ page }) => {
    await page.goto('/admin/metrics');

    // Statistiques globales
    await expect(page.locator('text=/Total Users/')).toBeVisible();
    await expect(page.locator('text=/Total Dossiers/')).toBeVisible();
    await expect(page.locator('text=/Revenue/')).toBeVisible();
  });

  test('should manage user permissions', async ({ page }) => {
    await page.goto('/admin/users');

    // Cliquer sur user
    await page.click('table tbody tr:first-child a');

    // Modifier role
    await page.selectOption('select[name="role"]', 'AVOCAT');
    await page.click('button:has-text("Enregistrer")');

    // Vérifier toast succès
    await expect(page.locator('[role="alert"]:has-text("Modifié")')).toBeVisible();
  });

  test('should export data (RGPD)', async ({ page }) => {
    await page.goto('/admin/rgpd');

    // Demander export
    await page.fill('input[type="email"]', 'user@test.com');
    await page.click('button:has-text("Exporter données")');

    // Vérifier demande créée
    await expect(page.locator('text="Export en cours"')).toBeVisible();
  });
});
