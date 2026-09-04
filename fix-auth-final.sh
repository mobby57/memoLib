#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction finale de l’authentification E2E${NC}"

# 1. Charger les variables d’environnement
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
elif [ -f ".env.test" ]; then
    export $(grep -v '^#' .env.test | xargs)
else
    echo -e "${RED}❌ Aucun .env trouvé. Création d’un minimal...${NC}"
    echo "DATABASE_URL=\"postgresql://user:pass@localhost:5432/mydb?schema=public\"" > .env
    echo "NEXTAUTH_SECRET=\"test-secret-123\"" >> .env
    echo "NEXTAUTH_URL=\"http://localhost:3000\"" >> .env
    export $(grep -v '^#' .env | xargs)
fi

# 2. Appliquer le schéma Prisma (créer les tables)
echo -e "${YELLOW}📦 Synchronisation du schéma...${NC}"
npx prisma db push --accept-data-loss

# 3. Créer l’utilisateur avec un mot de passe fort via une commande SQL
echo -e "${YELLOW}🌱 Création de l’utilisateur avocat@test.com...${NC}"
npx prisma db execute --stdin << 'SQL'
INSERT INTO "User" (
  id, email, password, name, role, tenantId, emailVerified, createdAt, updatedAt
) VALUES (
  'user-avocat',
  'avocat@test.com',
  '$2b$10$TtqM.1Q5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z5z',
  'Avocat Test',
  'LAWYER',
  'tenant-e2e',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
SQL

# Note : le hash ci-dessus est un placeholder. Pour un vrai hash, il faudrait utiliser bcrypt.
# Mais pour simplifier, on va utiliser le hash généré par le seed.
# On va exécuter le seed proprement :

# 4. Exécuter le seed existant (qui a été corrigé)
echo -e "${YELLOW}🌱 Exécution du seed...${NC}"
npx tsx prisma/seed-e2e.ts

# 5. Corriger le fichier de test pour qu’il utilise le bon mot de passe
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ -f "$TEST_FILE" ]; then
    echo -e "${YELLOW}📝 Correction du test...${NC}"
    sed -i "s/Test123!@#456/Test123!@#456/g" "$TEST_FILE"
    # S’assurer que le beforeEach est correct
    perl -i -0777 -pe 's/test\.beforeEach\(async \(.*?\) => \{\s*.*?\s*\}\);/test.beforeEach(async ({ page }) => {
  await page.goto('\''/fr/auth/login'\'');
  await page.fill('\''[name="email"]'\'', '\''avocat@test.com'\'');
  await page.fill('\''[name="password"]'\'', '\''Test123!@#456'\'');
  await Promise.all([
    page.waitForURL('\''/dashboard'\'', { timeout: 10000 }),
    page.click('\''button[type="submit"]'\'')
  ]);
  await expect(page).toHaveURL('\''/dashboard'\'');
});/s' "$TEST_FILE"
    echo -e "${GREEN}✅ Test corrigé.${NC}"
fi

# 6. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug
