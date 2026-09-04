#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Lancement du serveur Next.js et des tests E2E${NC}"

# 1. Tuer tout processus Next.js existant
pkill -f "next" 2>/dev/null || true
sleep 2

# 2. Libérer le port 3000
if lsof -i :3000 > /dev/null 2>&1; then
    kill -9 $(lsof -t -i :3000) 2>/dev/null || true
fi

# 3. Démarrer le serveur (avec variables d'environnement de test)
echo -e "${YELLOW}⏳ Démarrage du serveur (npm run dev)...${NC}"
export PORT=3000
npm run dev -- -p 3000 > server.log 2>&1 &
SERVER_PID=$!
echo "PID du serveur : $SERVER_PID"

# 4. Attendre que le serveur soit prêt (vérification HTTP)
echo -n "Attente du serveur"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "\n${GREEN}✅ Serveur prêt sur http://localhost:3000${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# 5. Si le serveur n'est pas prêt, afficher les logs et sortir
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "\n${RED}❌ Le serveur n'a pas démarré. Logs :${NC}"
    cat server.log
    exit 1
fi

# 6. Lancer les tests Playwright (en série pour éviter conflits)
echo -e "${YELLOW}🧪 Lancement des tests E2E (mode série, retries 3)...${NC}"
npx playwright test --workers=1 --retries=3

# 7. Récupérer le résultat
RESULT=$?

# 8. Arrêter le serveur
echo -e "${YELLOW}🛑 Arrêt du serveur (PID $SERVER_PID)${NC}"
kill $SERVER_PID 2>/dev/null || true

# 9. Afficher le résultat final
if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
else
    echo -e "${RED}❌ Certains tests ont échoué. Ouvrez le rapport :${NC}"
    echo "   npx playwright show-report"
fi
