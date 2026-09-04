#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔍 Détection automatique de la page de connexion...${NC}"

# 1. Tester les routes possibles
ROUTES=("/auth/signin" "/login" "/auth/login" "/signin" "/connexion")
FOUND_ROUTE=""
for route in "${ROUTES[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route" | grep -q "200"; then
        FOUND_ROUTE="$route"
        echo -e "${GREEN}✅ Route trouvée : $route${NC}"
        break
    fi
done

if [ -z "$FOUND_ROUTE" ]; then
    echo -e "${RED}❌ Aucune route de connexion trouvée. Vérifiez que le serveur tourne sur le port 3000.${NC}"
    exit 1
fi

# 2. Extraire le HTML de la page pour trouver les champs
HTML=$(curl -s "http://localhost:3000$FOUND_ROUTE")
# Chercher les attributs name ou id pour email/password
EMAIL_SELECTOR=""
PASSWORD_SELECTOR=""
if echo "$HTML" | grep -q 'name="email"'; then
    EMAIL_SELECTOR='[name="email"]'
elif echo "$HTML" | grep -q 'id="email"'; then
    EMAIL_SELECTOR='#email'
elif echo "$HTML" | grep -q 'data-testid="email"'; then
    EMAIL_SELECTOR='[data-testid="email"]'
else
    # Fallback : on demande à l'utilisateur
    echo -e "${YELLOW}⚠️  Champ email non détecté automatiquement.${NC}"
    echo -n "Entrez le sélecteur pour le champ email (ex: #email) : "
    read EMAIL_SELECTOR
fi

if [ -z "$EMAIL_SELECTOR" ]; then
    echo -e "${RED}❌ Sélecteur email non défini. Abandon.${NC}"
    exit 1
fi

# Même chose pour password
if echo "$HTML" | grep -q 'name="password"'; then
    PASSWORD_SELECTOR='[name="password"]'
elif echo "$HTML" | grep -q 'id="password"'; then
    PASSWORD_SELECTOR='#password'
elif echo "$HTML" | grep -q 'data-testid="password"'; then
    PASSWORD_SELECTOR='[data-testid="password"]'
else
    echo -n "Entrez le sélecteur pour le champ password (ex: #password) : "
    read PASSWORD_SELECTOR
fi

if [ -z "$PASSWORD_SELECTOR" ]; then
    echo -e "${RED}❌ Sélecteur password non défini. Abandon.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Sélecteurs détectés :${NC}"
echo "   Route : $FOUND_ROUTE"
echo "   Email  : $EMAIL_SELECTOR"
echo "   Mot de passe : $PASSWORD_SELECTOR"

# 3. Mettre à jour le fichier de test
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"

# Sauvegarder une copie
cp "$TEST_FILE" "$TEST_FILE.bak"

# Remplacer le page.goto, le fill email et password
sed -i "s|await page.goto('/auth/signin');|await page.goto('$FOUND_ROUTE');|g" "$TEST_FILE"
sed -i "s|await page.fill('[name=\"email\"]', 'avocat@test.com');|await page.fill('$EMAIL_SELECTOR', 'avocat@test.com');|g" "$TEST_FILE"
sed -i "s|await page.fill('[name=\"password\"]', 'Test123!');|await page.fill('$PASSWORD_SELECTOR', 'Test123!');|g" "$TEST_FILE"

echo -e "${GREEN}✅ Fichier $TEST_FILE mis à jour.${NC}"

# 4. Lancer le test en mode debug pour vérifier
echo -e "${YELLOW}🧪 Lancement du test en mode debug (appuyez sur 'Resume' pour avancer)...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts:12 --debug
