import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Mock authenticated session
  await page.context().addCookies([{
    name: 'next-auth.session-token',
    value: 'mock-session-token',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    expires: Date.now() / 1000 + 86400
  }]);
  
  await page.context().storageState({ path: authFile });
});
