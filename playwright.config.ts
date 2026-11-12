import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.test.local') });

const authFile = path.join(__dirname, 'tests', 'ux', '.auth', 'user.json');
const hasAuth = fs.existsSync(authFile);
const storageState = hasAuth ? authFile : undefined;

const PORT = 3456;

export default defineConfig({
  testDir: './tests/ux',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 120000,
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