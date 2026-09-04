#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction du test après crash de la page${NC}"

# 1. Sauvegarder le fichier actuel
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
cp "$TEST_FILE" "$TEST_FILE.bak.$(date +%s)"

# 2. Remplacer le beforeEach par une version robuste avec gestion d'erreur
cat > "$TEST_FILE" << 'TS'
import { test, expect } from '@playwright/test';

test.describe('Scénarios Avancés MemoLib', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/auth/login');
    await page.fill('[name="email"]', 'avocat@test.com');
    await page.fill('[name="password"]', 'Test123!@#456');

    // Soumettre et attendre la navigation
    await Promise.all([
      page.waitForURL(/\/dashboard|\/fr\/admin/, { timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    // Attendre que la page soit stable
    await page.waitForLoadState('networkidle');

    // Vérifier qu'on est bien sur une page authentifiée
    const url = page.url();
    if (url.includes('/login')) {
      const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => '');
      throw new Error(`Login failed: ${errorMsg}`);
    }
    expect(url).toMatch(/\/dashboard|\/fr\/admin/);

    // Vérifier qu'il n'y a pas de popup d'erreur Next.js
    const errorDialog = page.locator('dialog[role="alertdialog"]');
    if (await errorDialog.isVisible()) {
      const errorText = await errorDialog.textContent();
      throw new Error(`Page crashed: ${errorText}`);
    }

    // S'assurer que le contenu est chargé avant de passer au test
    await page.waitForSelector('main', { timeout: 10000 });
  });

  test('Workflow complet dossier client', async ({ page }) => {
    // Attendre que l'élément soit présent avant de cliquer
    await page.waitForSelector('[data-testid="new-case"]', { timeout: 10000 });
    await page.click('[data-testid="new-case"]');
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

echo -e "${GREEN}✅ Fichier test corrigé.${NC}"

# 3. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts --debug
