import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import path from 'path';

setup.describe.configure({ mode: 'serial' });

setup('global setup', async ({}) => {
  await clerkSetup();
});

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_EMAIL;

  if (!email) {
    console.warn('⚠️ TEST_EMAIL absent — auth ignorée');
    setup.skip();
    return;
  }

  await page.goto('/fr');
  await page.waitForLoadState('networkidle');

  // La méthode officielle : bypass UI via l'API backend
  await clerk.signIn({
    page,
    emailAddress: email,
  });

  await page.context().storageState({ path: authFile });
  console.log('✅ Session Clerk sauvegardée');
});
