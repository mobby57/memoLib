#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🧹 Nettoyage du port 9323...${NC}"
# Tuer le processus qui utilise le port 9323
if lsof -i :9323 > /dev/null 2>&1; then
    kill -9 $(lsof -t -i :9323) 2>/dev/null || true
    echo -e "${GREEN}✅ Port 9323 libéré.${NC}"
else
    echo -e "${YELLOW}⚠️  Aucun processus sur le port 9323.${NC}"
fi

# Tuer les serveurs Next.js en cours
pkill -f "next" 2>/dev/null || true
sleep 1

echo -e "${YELLOW}🧪 Lancement des tests avancés (avec webServer)...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts --workers=1 --retries=2

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests passent !${NC}"
else
    echo -e "${RED}❌ Certains tests ont échoué. Ouverture du rapport...${NC}"
    npx playwright show-report --port 9324 &
    echo -e "📊 Rapport disponible sur http://localhost:9324"
fi
