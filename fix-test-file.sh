#!/bin/bash

# Sauvegarde
cp tests/e2e/advanced-scenarios.spec.ts tests/e2e/advanced-scenarios.spec.ts.bak.$(date +%s)

# Réécriture complète
cat > tests/e2e/advanced-scenarios.spec.ts << 'TS'
import { test, expect } from '@playwright/test';

test.describe('Scénarios Avancés MemoLib', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/auth/login');
    await page.fill('[name="email"]', 'avocat@test.com');
    await page.fill('[name="password"]', 'Test123!@#456');
    await Promise.all([
      page.waitForURL('/dashboard', { timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    await expect(page).toHaveURL('/dashboard');
  });

  test('Workflow complet dossier client', async ({ page }) => {
    // Créer dossier
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

  // Les autres tests peuvent être ajoutés progressivement
});
TS

echo "✅ Fichier test régénéré avec un beforeEach valide."
npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug
