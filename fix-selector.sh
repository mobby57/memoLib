#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction du sélecteur manquant sur le dashboard${NC}"

TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
cp "$TEST_FILE" "$TEST_FILE.bak.$(date +%s)"

# Remplacer le test par une version qui cherche plusieurs sélecteurs
cat > "$TEST_FILE" << 'TS'
import { test, expect } from '@playwright/test';

test.describe('Scénarios Avancés MemoLib', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/auth/login');
    await page.fill('[name="email"]', 'avocat@test.com');
    await page.fill('[name="password"]', 'Test123!@#456');

    await Promise.all([
      page.waitForURL(/\/dashboard|\/fr\/admin/, { timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('/login')) {
      const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => '');
      throw new Error(`Login failed: ${errorMsg}`);
    }
    expect(url).toMatch(/\/dashboard|\/fr\/admin/);

    // Vérifier les erreurs JS
    const errorDialog = page.locator('dialog[role="alertdialog"]');
    if (await errorDialog.isVisible()) {
      const errorText = await errorDialog.textContent();
      throw new Error(`Page crashed: ${errorText}`);
    }

    // Capture d'écran pour déboguer
    await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });
    console.log('📸 Dashboard screenshot saved as dashboard-debug.png');

    // Attendre que le contenu principal soit chargé
    await page.waitForSelector('main', { timeout: 10000 });
  });

  test('Workflow complet dossier client', async ({ page }) => {
    // Essayer plusieurs sélecteurs possibles pour le bouton "Créer un dossier"
    const selectors = [
      '[data-testid="new-case"]',
      '[data-testid="create-case"]',
      '[data-testid="new-dossier"]',
      'button:has-text("Créer un dossier")',
      'a:has-text("Créer un dossier")',
      '[data-testid="add-case"]',
      '[data-testid="create-dossier"]'
    ];

    let found = false;
    for (const selector of selectors) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        found = true;
        console.log(`✅ Cliqué sur : ${selector}`);
        break;
      }
    }

    if (!found) {
      // Si aucun sélecteur ne fonctionne, on fait une capture et on échoue avec un message clair
      await page.screenshot({ path: 'dashboard-no-button.png', fullPage: true });
      throw new Error(
        '❌ Aucun bouton de création de dossier trouvé. ' +
        'Voir dashboard-no-button.png. ' +
        'Sélecteurs testés : ' + selectors.join(', ')
      );
    }

    // Remplir le formulaire (les sélecteurs suivants sont conservés tels quels)
    await page.fill('[name="clientName"]', 'Jean Dupont');
    await page.fill('[name="caseType"]', 'Immigration');
    await page.click('[data-testid="save-case"]');

    // Ajouter document
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/passport.pdf');
    await expect(page.locator('[data-testid="document-list"]')).toContainText('passport.pdf');

    // Planifier deadline
    await page.click('[data-testid="add-deadline"]');
    await page.fill('[name="deadline"]', '2024-12-31');
    await page.click('[data-testid="save-deadline"]');

    // Vérifier notification
    await expect(page.locator('[data-testid="notification"]')).toBeVisible();
  });
});
TS

echo -e "${GREEN}✅ Fichier test mis à jour avec recherche de sélecteurs alternatifs.${NC}"
echo -e "${YELLOW}📸 Une capture d'écran sera sauvegardée sur le dashboard.${NC}"

# Lancer le test
npx playwright test tests/e2e/advanced-scenarios.spec.ts --debug
