#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Réinitialisation complète et test E2E${NC}"

# 1. Charger les variables d'environnement
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
elif [ -f ".env.test" ]; then
    export $(grep -v '^#' .env.test | xargs)
else
    echo -e "${RED}❌ Aucun .env trouvé.${NC}"
    exit 1
fi

# 2. Configurer le seed dans package.json
echo -e "${YELLOW}📝 Configuration du seed dans package.json...${NC}"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.prisma = pkg.prisma || {};
pkg.prisma.seed = 'tsx prisma/seed-e2e.ts';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ package.json mis à jour.');
"

# 3. Réinitialiser la base et exécuter le seed
echo -e "${YELLOW}🗄️  Réinitialisation de la base...${NC}"
npx prisma db push --force-reset --accept-data-loss

echo -e "${YELLOW}🌱 Exécution du seed...${NC}"
npx prisma db seed

# 4. Vérifier que l'utilisateur a bien été créé
echo -e "${YELLOW}🔍 Vérification de l'utilisateur...${NC}"
USER_EXISTS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\" WHERE email='avocat@test.com';" 2>/dev/null | grep -v "Script" | tr -d ' ')
if [ "$USER_EXISTS" -eq "0" ]; then
    echo -e "${RED}❌ Utilisateur non trouvé. Insertion directe...${NC}"
    # Générer le hash bcrypt pour 'Test123!@#456' via node
    HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Test123!@#456', 10).then(h => console.log(h));")
    npx prisma db execute --stdin <<< "
INSERT INTO \"User\" (id, email, password, name, role, tenantId, emailVerified, createdAt, updatedAt)
VALUES (
  'user-avocat',
  'avocat@test.com',
  '$HASH',
  'Avocat Test',
  'LAWYER',
  'tenant-e2e',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
"
    echo -e "${GREEN}✅ Utilisateur créé manuellement.${NC}"
else
    echo -e "${GREEN}✅ Utilisateur déjà présent.${NC}"
fi

# 5. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts --debug
