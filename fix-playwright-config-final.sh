#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 Réécriture de playwright.config.ts (version stable)${NC}"

# Sauvegarde
cp playwright.config.ts playwright.config.ts.bak.$(date +%s)

# Écraser avec une config propre
cat > playwright.config.ts << 'PLAYWRIGHTCONFIG'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
PLAYWRIGHTCONFIG

echo -e "${GREEN}✅ playwright.config.ts réécrit proprement.${NC}"

# Tuer les processus Next.js en cours
echo -e "${YELLOW}🧹 Nettoyage des processus Next.js...${NC}"
pkill -f "next" 2>/dev/null || true
sleep 2

# Lancer les tests
echo -e "${YELLOW}🧪 Lancement des tests (workers=1, retries=2)...${NC}"
npx playwright test tests/e2e/advanced-scenarios.spec.ts --workers=1 --retries=2

RESULT=$?
if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests passent !${NC}"
else
    echo -e "${RED}❌ Certains tests ont échoué. Rapport :${NC}"
    npx playwright show-report &
fi
