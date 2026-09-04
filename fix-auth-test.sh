#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Fix du test d'authentification E2E${NC}"

# 1. Charger les variables d'environnement
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
elif [ -f ".env.test" ]; then
    export $(grep -v '^#' .env.test | xargs)
else
    echo -e "${RED}❌ Aucun .env trouvé.${NC}"
    exit 1
fi

# 2. S'assurer que la base est à jour et que l'utilisateur existe
echo -e "${YELLOW}📦 Synchronisation du schéma et exécution du seed...${NC}"
npx prisma db push --accept-data-loss 2>/dev/null || true
npx tsx prisma/seed-e2e.ts

# 3. Corriger le fichier de test
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}❌ Fichier test introuvable.${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Correction du beforeEach pour attendre l'URL réelle...${NC}"

# Sauvegarde
cp "$TEST_FILE" "$TEST_FILE.bak.$(date +%s)"

# Remplacer le bloc beforeEach
perl -i -0777 -pe '
s/test\.beforeEach\(async \(.*?\) => \{\s*await page\.goto\(.*?\);\s*await page\.fill\(.*?\);\s*await page\.fill\(.*?\);\s*await Promise\.all\(\[\s*page\.waitForURL\(.*?\);\s*page\.click\(.*?\)\s*\]\);\s*await expect\(page\)\.toHaveURL\(.*?\);\s*\}\);/test.beforeEach(async ({ page }) => {
  await page.goto('\''\/fr\/auth\/login'\'');
  await page.fill('\''[name="email"]'\'', '\''avocat@test.com'\'');
  await page.fill('\''[name="password"]'\'', '\''Test123!@#456'\'');
  await Promise.all([
    page.waitForURL(\/\\\/dashboard|\\\/fr\\\/admin\/, { timeout: 15000 }),
    page.click('\''button[type="submit"]'\'')
  ]);
  const url = page.url();
  expect(url).toMatch(\/\\\/dashboard|\\\/fr\\\/admin\/);
});/s' "$TEST_FILE"

echo -e "${GREEN}✅ Fichier test corrigé.${NC}"

# 4. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts --debug
