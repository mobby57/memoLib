#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🤖 AUTO-FIX E2E – DÉTECTION + CORRECTION ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# ---------------------------------------------------------------
# 1. NETTOYAGE & DÉMARRAGE DU SERVEUR
# ---------------------------------------------------------------
echo -e "${YELLOW}🧹 Nettoyage des anciens processus Next.js...${NC}"
pkill -f "next" 2>/dev/null || true
sleep 1

echo -e "${GREEN}🚀 Lancement du serveur (npm run dev) sur le port 3000...${NC}"
npm run dev -- -p 3000 > server.log 2>&1 &
SERVER_PID=$!
echo "PID serveur : $SERVER_PID"

echo -n "⏳ Attente du serveur"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "\n${GREEN}✅ Serveur prêt${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "\n${RED}❌ Le serveur n'a pas démarré. Logs :${NC}"
    cat server.log
    exit 1
fi

# ---------------------------------------------------------------
# 2. DÉTECTION DE LA ROUTE DE CONNEXION
# ---------------------------------------------------------------
echo -e "${YELLOW}🔍 Recherche de la route de connexion...${NC}"
ROUTES=("/auth/signin" "/login" "/auth/login" "/signin" "/connexion" "/auth/connexion")
FOUND_ROUTE=""
for route in "${ROUTES[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route")
    if [ "$status" = "200" ] || [ "$status" = "302" ]; then
        FOUND_ROUTE="$route"
        echo -e "${GREEN}✅ Route trouvée : $route (status $status)${NC}"
        break
    fi
done

if [ -z "$FOUND_ROUTE" ]; then
    echo -e "${RED}❌ Aucune route de connexion détectée automatiquement.${NC}"
    echo -n "Veuillez saisir la route manuellement (ex: /login) : "
    read FOUND_ROUTE
fi

# ---------------------------------------------------------------
# 3. DÉTECTION DES SÉLECTEURS (email / password)
# ---------------------------------------------------------------
HTML=$(curl -s "http://localhost:3000$FOUND_ROUTE")
EMAIL_SELECTOR=""
PASSWORD_SELECTOR=""

# Chercher dans l'ordre : name, id, data-testid, placeholder
detect_field() {
    local pattern=$1
    local html=$2
    local selector=""
    if echo "$html" | grep -q "name=\"$pattern\""; then
        selector="[name=\"$pattern\"]"
    elif echo "$html" | grep -q "id=\"$pattern\""; then
        selector="#$pattern"
    elif echo "$html" | grep -q "data-testid=\"$pattern\""; then
        selector="[data-testid=\"$pattern\"]"
    elif echo "$html" | grep -q "placeholder=\".*$pattern.*\""; then
        # Trouver le premier input avec un placeholder contenant le pattern
        placeholder=$(echo "$html" | grep -o "placeholder=\"[^\"]*$pattern[^\"]*\"" | head -1 | sed 's/placeholder="//;s/"//')
        if [ -n "$placeholder" ]; then
            selector="[placeholder=\"$placeholder\"]"
        fi
    fi
    echo "$selector"
}

EMAIL_SELECTOR=$(detect_field "email" "$HTML")
if [ -z "$EMAIL_SELECTOR" ]; then
    EMAIL_SELECTOR=$(detect_field "mail" "$HTML")
fi
if [ -z "$EMAIL_SELECTOR" ]; then
    echo -e "${YELLOW}⚠️  Champ email non détecté. Saisissez le sélecteur (ex: #email) :${NC}"
    read EMAIL_SELECTOR
fi

PASSWORD_SELECTOR=$(detect_field "password" "$HTML")
if [ -z "$PASSWORD_SELECTOR" ]; then
    echo -e "${YELLOW}⚠️  Champ password non détecté. Saisissez le sélecteur (ex: #password) :${NC}"
    read PASSWORD_SELECTOR
fi

echo -e "${GREEN}✅ Sélecteurs :${NC}"
echo "   Route   : $FOUND_ROUTE"
echo "   Email   : $EMAIL_SELECTOR"
echo "   Password: $PASSWORD_SELECTOR"

# ---------------------------------------------------------------
# 4. MISE À JOUR DU FICHIER DE TEST
# ---------------------------------------------------------------
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}❌ Fichier $TEST_FILE introuvable.${NC}"
    exit 1
fi

cp "$TEST_FILE" "$TEST_FILE.bak"
echo -e "${YELLOW}📝 Mise à jour du fichier de test...${NC}"

# Remplacer la route
sed -i "s|await page.goto('/auth/signin');|await page.goto('$FOUND_ROUTE');|g" "$TEST_FILE"
# Remplacer les sélecteurs email/password
sed -i "s|await page.fill('[name=\"email\"]', 'avocat@test.com');|await page.fill('$EMAIL_SELECTOR', 'avocat@test.com');|g" "$TEST_FILE"
sed -i "s|await page.fill('[name=\"password\"]', 'Test123!');|await page.fill('$PASSWORD_SELECTOR', 'Test123!');|g" "$TEST_FILE"

echo -e "${GREEN}✅ Fichier mis à jour. Sauvegarde : $TEST_FILE.bak${NC}"

# ---------------------------------------------------------------
# 5. LANCEMENT DES TESTS (en mode debug ou full)
# ---------------------------------------------------------------
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Que voulez-vous faire ?${NC}"
echo "1) Lancer le test en mode DEBUG (recommandé pour vérifier la connexion)"
echo "2) Lancer toute la suite avancée avec retries (workers=1, retries=3)"
echo "3) Quitter sans lancer"
read -p "Votre choix (1/2/3) : " CHOICE

case $CHOICE in
    1)
        echo -e "${GREEN}🧪 Lancement en mode debug sur le premier test...${NC}"
        npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug
        ;;
    2)
        echo -e "${GREEN}🧪 Lancement de toute la suite avancée...${NC}"
        npx playwright test tests/e2e/advanced-scenarios.spec.ts --workers=1 --retries=3
        ;;
    *)
        echo -e "${YELLOW}👋 Arrêt sans lancer les tests.${NC}"
        ;;
esac

# ---------------------------------------------------------------
# 6. ARRÊT DU SERVEUR
# ---------------------------------------------------------------
echo -e "${YELLOW}🛑 Arrêt du serveur (PID $SERVER_PID)${NC}"
kill $SERVER_PID 2>/dev/null || true
pkill -f "next" 2>/dev/null || true

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Terminé.${NC}"
