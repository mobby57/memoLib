#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction automatique de l'authentification E2E${NC}"

# 1. Vérifier que l'utilisateur existe
echo -e "${YELLOW}🔍 Vérification de l'utilisateur avocat@test.com...${NC}"
USER_EXISTS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\" WHERE email='avocat@test.com';" 2>/dev/null | grep -v "Script" | tr -d ' ')

if [ -z "$USER_EXISTS" ] || [ "$USER_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Utilisateur non trouvé. Exécution du seed...${NC}"
    npx tsx prisma/seed-e2e.ts
else
    echo -e "${GREEN}✅ Utilisateur déjà présent.${NC}"
fi

# 2. Forcer un mot de passe fort dans le seed (si pas déjà)
PASSWORD='Test123!@#456'
echo -e "${YELLOW}📝 Mise à jour du seed avec un mot de passe fort...${NC}"
sed -i "s|await bcrypt.hash('Test123!', 10)|await bcrypt.hash('$PASSWORD', 10)|g" prisma/seed-e2e.ts

# 3. Mettre à jour le test avec le mot de passe fort et la navigation
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ -f "$TEST_FILE" ]; then
    echo -e "${YELLOW}📝 Correction du fichier de test...${NC}"
    # Remplacer le mot de passe
    sed -i "s|'Test123!'|'$PASSWORD'|g" "$TEST_FILE"
    # Remplacer la navigation simple par waitForURL
    sed -i '/await page.click('\''button\[type="submit"\]'\'');/a\    await page.waitForURL('/dashboard', { timeout: 10000 });' "$TEST_FILE"
    sed -i '/await page.click('\''button\[type="submit"\]'\'');/d' "$TEST_FILE"
    echo -e "${GREEN}✅ Test mis à jour.${NC}"
else
    echo -e "${RED}❌ Fichier test introuvable.${NC}"
fi

# 4. Relancer le seed pour appliquer le nouveau mot de passe
echo -e "${YELLOW}🌱 Réexécution du seed pour appliquer le nouveau hash...${NC}"
npx tsx prisma/seed-e2e.ts

# 5. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug
