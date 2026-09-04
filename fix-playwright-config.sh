#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🔧 DÉSACTIVATION DU WEBSERVER PLAYWRIGHT ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# 1. Désactiver webServer dans playwright.config.ts
if [ -f "playwright.config.ts" ]; then
    echo -e "${YELLOW}📝 Désactivation de webServer dans playwright.config.ts...${NC}"
    # Faire une copie de sauvegarde
    cp playwright.config.ts playwright.config.ts.bak
    # Commenter toute ligne contenant "webServer:" et les lignes suivantes jusqu'à la prochaine propriété
    sed -i '/webServer:/,/^[^ ]/ { /webServer:/ s/^/\/\/ /; /^  / s/^/\/\/ /; }' playwright.config.ts
    echo -e "${GREEN}✅ webServer désactivé (commenté)${NC}"
else
    echo -e "${RED}⚠️  playwright.config.ts introuvable. Ignoré.${NC}"
fi

# 2. Tuer tous les serveurs Next.js en cours
echo -e "${YELLOW}🧹 Nettoyage des processus Next.js...${NC}"
pkill -f "next" 2>/dev/null || true
sleep 2
for port in 3000 3001 3002; do
    if lsof -i :$port > /dev/null 2>&1; then
        kill -9 $(lsof -t -i :$port) 2>/dev/null || true
    fi
done
echo -e "${GREEN}✅ Nettoyage terminé${NC}"

# 3. Lancer le serveur manuellement
echo -e "${GREEN}🚀 Lancement du serveur de test (npm run dev)...${NC}"
export PORT=3000
npm run dev -- -p 3000 &> server.log &
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

# Vérifier si le serveur a démarré
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Le serveur n'a pas démarré. Logs :${NC}"
    cat server.log
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# 4. Exécuter les tests Playwright
echo -e "${YELLOW}🔄 Lancement des tests E2E (retries 3)...${NC}"
npx playwright test --retries=3
RESULT=$?

# 5. Arrêter le serveur
echo -e "${YELLOW}🛑 Arrêt du serveur...${NC}"
kill $SERVER_PID 2>/dev/null || true
pkill -f "next" 2>/dev/null || true

if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS PASSENT !${NC}"
else
    echo -e "${RED}❌ Certains tests ont échoué. Rapport HTML :${NC}"
    npx playwright show-report &
fi

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📌 Résumé :${NC}"
echo -e " - webServer désactivé dans playwright.config.ts"
echo -e " - Serveur lancé manuellement sur le port 3000"
echo -e " - Tests exécutés avec 3 retries"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
