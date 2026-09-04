#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔄 Restauration du webServer dans playwright.config.ts${NC}"

# 1. Sauvegarder la config actuelle
cp playwright.config.ts playwright.config.ts.bak

# 2. Vérifier si la section webServer existe déjà
if grep -q "webServer:" playwright.config.ts; then
    echo -e "${YELLOW}⚠️  webServer déjà présent, on le réactive en décommentant...${NC}"
    # Décommenter les lignes commentées
    sed -i 's/\/\/ *webServer:/webServer:/g' playwright.config.ts
    sed -i 's/\/\/ *  command:/  command:/g' playwright.config.ts
    sed -i 's/\/\/ *  url:/  url:/g' playwright.config.ts
    sed -i 's/\/\/ *  reuseExistingServer:/  reuseExistingServer:/g' playwright.config.ts
else
    echo -e "${YELLOW}➕ Ajout de la section webServer...${NC}"
    # Insérer la configuration avant la dernière accolade
    sed -i '/export default defineConfig({/a\
  webServer: {\
    command: "npm run dev -- -p 3000",\
    url: "http://localhost:3000",\
    reuseExistingServer: !process.env.CI,\
    timeout: 120 * 1000,\
  },' playwright.config.ts
fi

# 3. S'assurer que le port est cohérent avec les tests (baseURL)
if grep -q 'baseURL' playwright.config.ts; then
    sed -i 's|baseURL:.*|baseURL: "http://localhost:3000",|g' playwright.config.ts
else
    sed -i '/use: {/a\    baseURL: "http://localhost:3000",' playwright.config.ts
fi

echo -e "${GREEN}✅ Configuration mise à jour.${NC}"

# 4. Tuer tout serveur existant
pkill -f "next" 2>/dev/null || true
sleep 1

# 5. Lancer les tests avec webServer géré par Playwright
echo -e "${YELLOW}🧪 Lancement des tests avec webServer...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts --workers=1 --retries=2

# 6. Afficher le résultat
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests réussis !${NC}"
else
    echo -e "${RED}❌ Certains tests ont échoué. Rapport :${NC}"
    npx playwright show-report &
fi
