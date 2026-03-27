import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.join(process.cwd(), 'playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'e2e-mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 86400,
    },
  ]);

  // Pre-warm routes so Turbopack compiles them before the real tests run
  await page.route('**/api/auth/session**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'user-1', name: 'Test', email: 'test@example.com', role: 'LAWYER' },
        expires: '2099-01-01T00:00:00.000Z',
      }),
    });
  });
  await page.goto('/fr/tasks', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page
    .goto('/fr/dossiers', { waitUntil: 'domcontentloaded', timeout: 60000 })
    .catch(() => {});

  await page.context().storageState({ path: authFile });
});
