import { defineConfig } from '@playwright/test';

/**
 * Configuration Playwright simplifiée pour tests rapides
 */

export default defineConfig({
  testDir: '.',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  
  use: {
    baseURL: process.env.BASE_URL || 'https://memolib.vercel.app',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    headless: true,
  },
});
