#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔍 Vérification du serveur...${NC}"

# 1. Vérifier si le serveur répond
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  Serveur non trouvé. Démarrage...${NC}"
    npm run dev -- -p 3000 > server.log 2>&1 &
    echo -n "⏳ Attente du serveur"
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo -e "\n${GREEN}✅ Serveur prêt${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
else
    echo -e "${GREEN}✅ Serveur déjà en cours${NC}"
fi

# 2. Lancer Playwright Codegen
echo -e "${YELLOW}🖱️  Ouvrez Playwright Codegen sur /login${NC}"
echo -e "${YELLOW}👉 Cliquez sur le champ email, puis sur le champ mot de passe.${NC}"
echo -e "${YELLOW}📋 Copiez les sélecteurs qui apparaissent dans la console.${NC}"
echo -e "${BLUE}Appuyez sur Entrée pour lancer Codegen...${NC}"
read

npx playwright codegen http://localhost:3000/login

echo -e "${GREEN}✅ Terminé. Notez les sélecteurs et mettez-les à jour dans votre test.${NC}"
echo -e "${YELLOW}Exemple de correction :${NC}"
echo "  await page.fill('VOTRE_SELECTEUR_EMAIL', 'avocat@test.com');"
echo "  await page.fill('VOTRE_SELECTEUR_PASSWORD', 'Test123!');"
