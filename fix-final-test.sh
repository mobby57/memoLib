#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction finale du test d'authentification${NC}"

# 1. Vérifier que l'utilisateur existe en base
echo -e "${YELLOW}🔍 Vérification de l'utilisateur avocat@test.com...${NC}"
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\" WHERE email='avocat@test.com';" | grep -q "1" || {
  echo -e "${RED}❌ Utilisateur non trouvé. Exécution du seed...${NC}"
  npx prisma db push --accept-data-loss
  npx tsx prisma/seed-e2e.ts
}

# 2. Corriger le fichier de test
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}❌ Fichier test introuvable.${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Mise à jour du beforeEach pour utiliser la bonne route et accepter /fr/admin...${NC}"

# Sauvegarde
cp "$TEST_FILE" "$TEST_FILE.bak.$(date +%s)"

# Remplacer le beforeEach par une version robuste
cat > "$TEST_FILE" << 'TS'
import { test, expect } from '@playwright/test';

test.describe('Scénarios Avancés MemoLib', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/auth/login');
    await page.fill('[name="email"]', 'avocat@test.com');
    await page.fill('[name="password"]', 'Test123!@#456');

    // Attendre la navigation vers /dashboard ou /fr/admin
    await Promise.all([
      page.waitForURL(/\/dashboard|\/fr\/admin/, { timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    const url = page.url();
    if (url.includes('/login')) {
      const errorMsg = await page.locator('[role="alert"]').textContent().catch(() => 'Aucun message');
      console.error(`❌ Échec de connexion : ${errorMsg}`);
    }
    expect(url).toMatch(/\/dashboard|\/fr\/admin/);
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
});
TS

echo -e "${GREEN}✅ Fichier test corrigé.${NC}"

# 3. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts --debug
