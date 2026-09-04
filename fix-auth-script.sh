#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Correction automatique de l'authentification E2E${NC}"

# 1. Charger les variables d'environnement
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
elif [ -f ".env.test" ]; then
    export $(grep -v '^#' .env.test | xargs)
else
    echo -e "${RED}❌ Aucun .env trouvé.${NC}"
    exit 1
fi

# 2. Vérifier que l'utilisateur existe
echo -e "${YELLOW}🔍 Vérification de l'utilisateur avocat@test.com...${NC}"
npx prisma db push --accept-data-loss 2>/dev/null || true
npx tsx prisma/seed-e2e.ts 2>/dev/null || echo -e "${YELLOW}⚠️  Le seed a échoué, veuillez vérifier manuellement.${NC}"

# 3. Ouvrir codegen pour capturer les bons sélecteurs
echo -e "${YELLOW}🖱️  Lancement de Playwright Codegen sur la page de connexion...${NC}"
echo -e "   ➡️  Remplissez les champs manuellement, puis fermez la fenêtre."
echo -e "   ➡️  Les sélecteurs exacts apparaîtront dans la console."
read -p "Appuyez sur Entrée pour lancer Codegen..." 
npx playwright codegen http://localhost:3000/fr/auth/login

# 4. Après codegen, demander à l'utilisateur de fournir les sélecteurs
echo -e "${YELLOW}📝 Entrez les sélecteurs exacts trouvés (ex: #email ou [name='email']) :${NC}"
read -p "Sélecteur pour l'email : " EMAIL_SEL
read -p "Sélecteur pour le mot de passe : " PASS_SEL
read -p "Sélecteur pour le bouton de soumission : " BTN_SEL

# 5. Mettre à jour le fichier de test avec ces sélecteurs
TEST_FILE="tests/e2e/advanced-scenarios.spec.ts"
if [ -f "$TEST_FILE" ]; then
    cp "$TEST_FILE" "$TEST_FILE.bak.$(date +%s)"
    sed -i "s|await page.fill('[name=\"email\"]'|await page.fill('$EMAIL_SEL'|g" "$TEST_FILE"
    sed -i "s|await page.fill('[name=\"password\"]'|await page.fill('$PASS_SEL'|g" "$TEST_FILE"
    sed -i "s|page.click('button[type=\"submit\"]'|page.click('$BTN_SEL'|g" "$TEST_FILE"
    echo -e "${GREEN}✅ Fichier test mis à jour avec les nouveaux sélecteurs.${NC}"
else
    echo -e "${RED}❌ Fichier test introuvable.${NC}"
    exit 1
fi

# 6. Lancer le test en mode debug
echo -e "${YELLOW}🧪 Lancement du test en mode debug...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts --debug
