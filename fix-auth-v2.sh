#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction automatique de l'authentification E2E (v2)${NC}"

# 1. Charger les variables d'environnement (si .env existe)
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✅ Variables d'environnement chargées depuis .env${NC}"
elif [ -f ".env.test" ]; then
    export $(grep -v '^#' .env.test | xargs)
    echo -e "${GREEN}✅ Variables d'environnement chargées depuis .env.test${NC}"
else
    echo -e "${RED}❌ Aucun fichier .env trouvé. Création d'un .env minimal...${NC}"
    echo "DATABASE_URL=\"postgresql://user:pass@localhost:5432/mydb?schema=public\"" > .env
    echo "NEXTAUTH_SECRET=\"test-secret-123\"" >> .env
    echo "NEXTAUTH_URL=\"http://localhost:3000\"" >> .env
    export $(grep -v '^#' .env | xargs)
fi

# 2. Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL n'est pas défini. Vérifiez votre .env.${NC}"
    exit 1
fi

# 3. Appliquer le schéma Prisma (crée les tables si elles n'existent pas)
echo -e "${YELLOW}📦 Synchronisation du schéma Prisma...${NC}"
npx prisma db push --accept-data-loss

# 4. Exécuter le seed pour créer l'utilisateur avec un mot de passe fort
echo -e "${YELLOW}🌱 Exécution du seed...${NC}"
npx tsx prisma/seed-e2e.ts

# 5. Corriger le test : remplacer le beforeEach par une version robuste
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ -f "$TEST_FILE" ]; then
    echo -e "${YELLOW}📝 Correction du fichier de test (beforeEach)...${NC}"
    # Utilisation de Node.js pour faire un remplacement fiable
    node -e "
const fs = require('fs');
const path = 'tests/e2e/advanced-scenarios.spec.ts';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = /test\.beforeEach\(async \(\{ page \}\) => \{\s+await page\.goto\('\/fr\/login'\);\s+await page\.fill\('\[name="email"\]', 'avocat@test\.com'\);\s+await page\.fill\('\[name="password"\]', 'Test123!@#456'\);\s+await page\.waitForURL\([^)]+\);\s+await expect\(page\)\.toHaveURL\('\/dashboard'\);\s+\}\);/;

const newBlock = \`test.beforeEach(async ({ page }) => {
  await page.goto('/fr/auth/login');
  await page.fill('[name=\"email\"]', 'avocat@test.com');
  await page.fill('[name=\"password\"]', 'Test123!@#456');
  await Promise.all([
    page.waitForURL('/dashboard', { timeout: 10000 }),
    page.click('button[type=\"submit\"]')
  ]);
  await expect(page).toHaveURL('/dashboard');
});\`;

if (oldBlock.test(content)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(path, content);
  console.log('✅ beforeEach corrigé.');
} else {
  console.log('⚠️  Le bloc beforeEach n'a pas été trouvé, vérifiez manuellement.');
}
"
else
    echo -e "${RED}❌ Fichier test introuvable.${NC}"
    exit 1
fi

# 6. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug
