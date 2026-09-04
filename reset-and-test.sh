#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔄 Reset de la base de données E2E...${NC}"
npx prisma db push --force-reset

if [ -f "prisma/seed-e2e.ts" ]; then
    echo -e "${YELLOW}🌱 Exécution du seed E2E...${NC}"
    npx ts-node prisma/seed-e2e.ts
elif [ -f "prisma/seed.ts" ]; then
    echo -e "${YELLOW}🌱 Exécution du seed (par défaut)...${NC}"
    npx ts-node prisma/seed.ts
else
    echo -e "${RED}⚠️  Aucun seed trouvé. Créez un utilisateur manuellement.${NC}"
fi

echo -e "${GREEN}✅ Base de données prête.${NC}"

# Lancer le serveur s'il n'est pas déjà en cours
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}🚀 Lancement du serveur...${NC}"
    npm run dev -- -p 3000 -H 0.0.0.0 > server.log 2>&1 &
    sleep 8
fi

# Lancer le test en mode debug
echo -e "${GREEN}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug
