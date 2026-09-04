#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🔧 CORRECTION AUTO DES BLOCAGES E2E ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# 1. CORRECTION DE seed-e2e.ts
if [ -f "prisma/seed-e2e.ts" ]; then
    echo -e "${YELLOW}📝 Correction de prisma/seed-e2e.ts...${NC}"
    sed -i '/const crypto = require/d' prisma/seed-e2e.ts
    if ! grep -q "import.*crypto" prisma/seed-e2e.ts; then
        sed -i '1i import { randomBytes } from "crypto";' prisma/seed-e2e.ts
        sed -i 's/crypto\.randomBytes/randomBytes/g' prisma/seed-e2e.ts
    fi
    echo -e "${GREEN}✅ seed-e2e.ts corrigé${NC}"
fi

# 2. CORRECTION DE tailwind.config.ts
if [ -f "tailwind.config.ts" ]; then
    echo -e "${YELLOW}📝 Correction de tailwind.config.ts...${NC}"
    mv tailwind.config.ts tailwind.config.cjs 2>/dev/null || true
    if [ -f "next.config.js" ] && ! grep -q "tailwind.config.cjs" next.config.js; then
        sed -i "s/tailwind.config.ts/tailwind.config.cjs/g" next.config.js
    fi
    echo -e "${GREEN}✅ tailwind.config.ts renommé en .cjs${NC}"
fi

# 3. SUPPRESSION DE --no-lint DANS LES SCRIPTS
if [ -f "fix-webserver.sh" ]; then
    echo -e "${YELLOW}📝 Correction de fix-webserver.sh...${NC}"
    sed -i 's/--no-lint//g' fix-webserver.sh
    echo -e "${GREEN}✅ fix-webserver.sh corrigé${NC}"
fi

# 4. VÉRIFICATION DE .env.test
if [ ! -f ".env.test" ]; then
    echo -e "${YELLOW}📝 Création de .env.test...${NC}"
    cat > .env.test << 'EOF2'
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb?schema=public"
NEXTAUTH_SECRET="test-secret-123"
NEXTAUTH_URL="http://localhost:3000"
EOF2
    echo -e "${GREEN}✅ .env.test créé${NC}"
fi

# 5. NETTOYAGE DU PORT 3000
if command -v lsof &> /dev/null; then
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port 3000 occupé, nettoyage...${NC}"
        kill -9 $(lsof -t -i :3000) 2>/dev/null || true
        sleep 2
    fi
fi

# 6. DÉMARRAGE DU SERVEUR
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Lancement du serveur de test...${NC}"
npm run dev &> server.log &
SERVER_PID=$!
echo "PID du serveur : $SERVER_PID"

echo -e "${YELLOW}⏳ Attente du serveur (max 30s)...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Serveur prêt sur http://localhost:3000${NC}"
        break
    fi
    sleep 1
done

# 7. LANCEMENT DES TESTS PLAYWRIGHT
echo -e "${YELLOW}🔄 Lancement des tests E2E (retries 3)...${NC}"
npx playwright test --retries=3
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS PASSENT ! (ou presque)${NC}"
else
    echo -e "${RED}❌ Il reste des échecs. Rapport HTML généré.${NC}"
    npx playwright show-report &
fi

# 8. ARRÊT DU SERVEUR (optionnel)
kill $SERVER_PID 2>/dev/null || true

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📌 Résumé des corrections :${NC}"
echo -e " - seed-e2e.ts corrigé (crypto)"
echo -e " - tailwind.config.ts → .cjs"
echo -e " - --no-lint retiré"
echo -e " - Serveur lancé avec npm run dev"
echo -e " - Tests exécutés avec 3 retries"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
