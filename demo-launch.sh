#!/bin/bash
set -e

# 🎬 Script de démarrage rapide pour tester MemoLib en production
# Utilisation: ./demo-launch.sh

# Variables
BASE_URL="${1:-http://localhost:3000}"
ENVIRONMENT="${2:-dev}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Afficher l'en-tête
clear
cat << "EOF"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🎬 DÉMO MEMOLIB - SCRIPT DE LANCEMENT 🎬            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

EOF

echo -e "${BLUE}Environnement: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}\n"

# Vérifier Node.js
echo -e "${BLUE}⏳ Vérification des prérequis...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js non trouvé${NC}"
    exit 1
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm ${NPM_VERSION}${NC}"
else
    echo -e "${RED}❌ npm non trouvé${NC}"
    exit 1
fi

# Vérifier Playwright
if npm list @playwright/test &> /dev/null; then
    echo -e "${GREEN}✅ Playwright installé${NC}"
else
    echo -e "${YELLOW}⚠️  Installation de Playwright...${NC}"
    npm install -D @playwright/test
fi

# Vérifier la connectivité à l'API
echo -e "\n${BLUE}⏳ Vérification de la connectivité API...${NC}"
if command -v curl &> /dev/null; then
    HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo -e "\n000")
    HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ API accessible (HTTP ${HTTP_CODE})${NC}"
    else
        echo -e "${YELLOW}⚠️  API retourne: HTTP ${HTTP_CODE}${NC}"
        echo -e "${BLUE}💡 Tip: Lance 'npm run dev' dans src/frontend avant de lancer la démo${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl non disponible, vérification API ignorée${NC}"
fi

# Menu principal
cat << "EOF"

╔════════════════════════════════════════════════════════════════╗
║ SÉLECTIONNE UNE OPTION DE DÉMO                               ║
╚════════════════════════════════════════════════════════════════╝

  1. Tester LOGIN (authentification)
  2. Tester DASHBOARD
  3. Tester PREUVE LÉGALE (création)
  4. Tester LISTE DES PREUVES
  5. Tester EXPORT (PDF/JSON/XML)
  6. Tester SIGNATURE eIDAS
  7. Tester RÈGLES SECTORIELLES
  8. Tester SANTÉ API
  9. Exécuter TOUS LES TESTS
  10. Ouvrir l'APP dans le navigateur
  0. Quitter

EOF

read -p "Choix (0-10): " choice

case $choice in
    1)
        echo -e "\n${BLUE}🔐 Lancement du test LOGIN...${NC}"
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Login avec identifiants de test" --reporter=list
        ;;
    2)
        echo -e "\n${BLUE}📊 Lancement du test DASHBOARD...${NC}"
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Accès au dashboard principal" --reporter=list
        ;;
    3)
        echo -e "\n${BLUE}📄 Lancement du test PREUVE LÉGALE...${NC}"
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Générer une preuve légale" --reporter=list
        ;;
    4)
        echo -e "\n${BLUE}📋 Lancement du test LISTE DES PREUVES...${NC}"
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Afficher la liste des preuves légales" --reporter=list
        ;;
    5)
        echo -e "\n${BLUE}📊 Lancement du test EXPORT...${NC}"
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Exporter une preuve" --reporter=list
        ;;
    6)
        echo -e "\n${BLUE}🔐 Lancement du test SIGNATURE eIDAS...${NC}"
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Ajouter une signature eIDAS" --reporter=list
        ;;
    7)
        echo -e "\n${BLUE}📚 Lancement du test RÈGLES SECTORIELLES...${NC}"
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Consulter les règles sectorielles" --reporter=list
        ;;
    8)
        echo -e "\n${BLUE}🏥 Lancement du test SANTÉ API...${NC}"
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Vérifier la santé de l'API" --reporter=list
        ;;
    9)
        echo -e "\n${BLUE}🚀 Lancement de TOUS LES TESTS...${NC}"
        echo -e "${YELLOW}⏱️  Durée estimée: 2-3 minutes${NC}\n"

        export BASE_URL="$BASE_URL"
        npx playwright test tests/e2e/demo-complete.spec.ts --reporter=list,html

        echo -e "\n${GREEN}✅ Rapport HTML généré: playwright-report/index.html${NC}"

        # Ouvrir le rapport si disponible
        if command -v xdg-open &> /dev/null; then
            xdg-open playwright-report/index.html
        elif command -v open &> /dev/null; then
            open playwright-report/index.html
        fi
        ;;
    10)
        echo -e "\n${BLUE}🌐 Ouverture de l'application...${NC}"

        if [ "$ENVIRONMENT" = "prod" ]; then
            URL="https://memolib.fly.dev"
        else
            URL="$BASE_URL"
        fi

        if command -v xdg-open &> /dev/null; then
            xdg-open "$URL" &
        elif command -v open &> /dev/null; then
            open "$URL" &
        else
            echo -e "${YELLOW}⚠️  Ouvre manuellement: $URL${NC}"
        fi

        echo -e "${GREEN}✅ Application ouverte: $URL${NC}"
        ;;
    0)
        echo -e "\n${BLUE}👋 Au revoir!${NC}"
        exit 0
        ;;
    *)
        echo -e "\n${RED}❌ Option invalide: $choice${NC}"
        exit 1
        ;;
esac

# Résumé final
cat << "EOF"

╔════════════════════════════════════════════════════════════════╗
║ ✅ TEST COMPLÉTÉ                                            ║
╚════════════════════════════════════════════════════════════════╝

📚 Documentation disponible:
  • DEMO_SCRIPT_INTERACTIVE.md    - Guide détaillé de démo
  • docs/ARCHITECTURE.md          - Architecture technique
  • QUICK_START_PRODUCTION.md     - Démarrage rapide

🚀 URLs de production:
  • App:        https://memolib.fly.dev
  • API Health: https://memolib.fly.dev/api/health
  • Login:      https://memolib.fly.dev/auth/login

💬 Support:
  • Email:      contact@memolib.fr
  • GitHub:     github.com/mobby57/memoLib

EOF

echo -e "${GREEN}Merci d'avoir testé MemoLib! 🎉${NC}\n"
