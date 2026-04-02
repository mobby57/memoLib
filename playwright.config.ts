import { defineConfig, devices } from '@playwright/test';

const hasDatabase = Boolean(process.env.DATABASE_URL);

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: hasDatabase
    ? []
    : [
        'tests/e2e/advanced-scenarios.spec.ts',
        'tests/e2e/critical-features.spec.ts',
        'tests/e2e/demo-complete.spec.ts',
        'tests/e2e/demo-login-simple.spec.ts',
        'tests/e2e/legal-proof.spec.ts',
        'tests/e2e/lawyer-dashboard.spec.ts',
        'tests/e2e/workspaces.spec.ts',
      ],
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list'], ['json', { outputFile: 'test-results/results.json' }]],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run db:generate && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: '.',
  },
});
