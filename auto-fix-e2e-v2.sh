#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🤖 AUTO-FIX E2E V2 (avec IP 10.255.255.254) ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

BASE_URL="http://10.255.255.254:3000"

# 1. Vérifier que le serveur répond
if ! curl -s "$BASE_URL" > /dev/null; then
    echo -e "${RED}❌ Serveur inaccessible sur $BASE_URL. Vérifiez qu'il tourne.${NC}"
    exit 1
fi

# 2. Détection de la route de connexion
echo -e "${YELLOW}🔍 Recherche de la route de connexion...${NC}"
ROUTES=("/fr/login" "/login" "/connexion" "/fr/auth/signin" "/auth/signin")
FOUND_ROUTE=""
for route in "${ROUTES[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$status" = "200" ] || [ "$status" = "302" ]; then
        FOUND_ROUTE="$route"
        echo -e "${GREEN}✅ Route trouvée : $route (status $status)${NC}"
        break
    fi
done

if [ -z "$FOUND_ROUTE" ]; then
    echo -e "${RED}❌ Aucune route de connexion trouvée.${NC}"
    exit 1
fi

# 3. Récupération du HTML de la page
HTML=$(curl -s "$BASE_URL$FOUND_ROUTE")

# 4. Détection des sélecteurs email et password
echo -e "${YELLOW}🔍 Détection des sélecteurs...${NC}"
# On cherche d'abord name, puis id, puis data-testid
if echo "$HTML" | grep -q 'name="email"'; then
    EMAIL_SELECTOR='[name="email"]'
elif echo "$HTML" | grep -q 'id="email"'; then
    EMAIL_SELECTOR='#email'
elif echo "$HTML" | grep -q 'data-testid="email"'; then
    EMAIL_SELECTOR='[data-testid="email"]'
else
    # Si rien, on demande à l'utilisateur
    echo -e "${YELLOW}⚠️  Champ email non détecté automatiquement.${NC}"
    read -p "Entrez le sélecteur pour le champ email (ex: #email) : " EMAIL_SELECTOR
fi

if echo "$HTML" | grep -q 'name="password"'; then
    PASSWORD_SELECTOR='[name="password"]'
elif echo "$HTML" | grep -q 'id="password"'; then
    PASSWORD_SELECTOR='#password'
elif echo "$HTML" | grep -q 'data-testid="password"'; then
    PASSWORD_SELECTOR='[data-testid="password"]'
else
    echo -e "${YELLOW}⚠️  Champ password non détecté automatiquement.${NC}"
    read -p "Entrez le sélecteur pour le champ password (ex: #password) : " PASSWORD_SELECTOR
fi

echo -e "${GREEN}✅ Sélecteurs :${NC}"
echo "   Route   : $FOUND_ROUTE"
echo "   Email   : $EMAIL_SELECTOR"
echo "   Password: $PASSWORD_SELECTOR"

# 5. Mise à jour du fichier de test
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ ! -f "$TEST_FILE" ]; then
    echo -e "${RED}❌ Fichier $TEST_FILE introuvable.${NC}"
    exit 1
fi

cp "$TEST_FILE" "$TEST_FILE.bak"
echo -e "${YELLOW}📝 Mise à jour du fichier de test...${NC}"

# Remplacer la route
sed -i "s|await page.goto('/login');|await page.goto('$FOUND_ROUTE');|g" "$TEST_FILE"
# Remplacer les sélecteurs
sed -i "s|await page.fill('[name=\"email\"]', 'avocat@test.com');|await page.fill('$EMAIL_SELECTOR', 'avocat@test.com');|g" "$TEST_FILE"
sed -i "s|await page.fill('[name=\"password\"]', 'Test123!');|await page.fill('$PASSWORD_SELECTOR', 'Test123!');|g" "$TEST_FILE"

echo -e "${GREEN}✅ Fichier mis à jour. Sauvegarde : $TEST_FILE.bak${NC}"

# 6. Proposition de lancement
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Que voulez-vous faire ?${NC}"
echo "1) Lancer le test en mode DEBUG"
echo "2) Lancer toute la suite avancée (workers=1, retries=3)"
echo "3) Quitter"
read -p "Votre choix (1/2/3) : " CHOICE

case $CHOICE in
    1) npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug ;;
    2) npx playwright test tests/e2e/advanced-scenarios.spec.ts --workers=1 --retries=3 ;;
    *) echo -e "${YELLOW}👋 Arrêt.${NC}" ;;
esac

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Terminé.${NC}"
