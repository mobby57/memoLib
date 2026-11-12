import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Charge les variables de test
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') });

// DÃ©tection du fichier d'authentification sauvegardÃ©
const authFile = path.join(__dirname, 'tests', 'ux', '.auth', 'user.json');
const hasAuth = fs.existsSync(authFile);
const storageState = hasAuth ? authFile : undefined;

const PORT = 3456;

export default defineConfig({
  testDir: './tests/ux',
  timeout: 60000, // 60 secondes par test
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState },
      dependencies: hasAuth ? ['setup'] : [],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], storageState },
      dependencies: hasAuth ? ['setup'] : [],
    },
  ],
  webServer: {
    command: `npx next dev --port ${PORT} --webpack`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300000,
  },
});