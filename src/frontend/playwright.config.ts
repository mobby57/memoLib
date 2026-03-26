import { defineConfig, devices } from '@playwright/test';

import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..');
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : '75%',
  timeout: 15000,
  expect: { timeout: 5000 },

  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 10000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
          ],
        },
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: `npm --prefix "${repoRoot}" run dev -- --port 3200`,
    url: 'http://localhost:3200',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
