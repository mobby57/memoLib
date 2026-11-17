import { test, expect } from '@playwright/test';

async function loginWithClerk(page: any, email: string, password: string) {
  await page.goto('/fr/auth/login');
  await page.waitForSelector('input', { timeout: 15000 });
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[name="identifier"], input[type="email"], input[type="text"]').first();
  await emailInput.fill(email);
  await emailInput.press('Enter');
  await page.waitForTimeout(1500);

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill(password);
    await passwordInput.press('Enter');
    await page.waitForTimeout(2000);
  }

  // Gestion OTP (code 424242 pour +clerk_test)
  const otpInput = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
  if (await otpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('🔐 OTP demandé → saisie 424242');
    await otpInput.fill('424242');
    await otpInput.press('Enter');
    await page.waitForTimeout(2000);
  }

  // GESTION CLIENT TRUST (page de vérification de nouvel appareil)
  await page.waitForTimeout(2000);
  const currentUrl = page.url();
  if (currentUrl.includes('client-trust')) {
    console.log('🛡️  Page "client-trust" détectée, tentative de validation...');
    
    // Cherche un bouton de validation
    const trustBtn = page.getByRole('button', { name: /Continue|Continuer|Valider|Vérifier|Trust|Trust this device|Approuver|Autoriser/i }).first();
    if (await trustBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await trustBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Re-vérifie OTP après le trust
    const otpInput2 = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
    if (await otpInput2.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('🔐 OTP de vérification → saisie 424242');
      await otpInput2.fill('424242');
      await otpInput2.press('Enter');
      await page.waitForTimeout(2000);
    }
  }

  // Attendre la redirection finale vers /fr/dossiers
  try {
    await page.waitForURL(/\/fr\/(dossiers|dashboard)/, { timeout: 20000 });
  } catch (e) {
    console.log('⚠️  URL actuelle :', page.url());
    // Si on est toujours sur client-trust, on essaie d'aller directement sur /fr/dossiers/inviter
    await page.goto('/fr/dossiers/inviter');
    await page.waitForLoadState('networkidle');
  }
}

test('Démo : Inviter en 3 champs', async ({ page }) => {
  test.setTimeout(90_000);

  await loginWithClerk(page, 'test+clerk_test@memolib.dev', 'Mem0L!b_Secure_2026#Dupont');
  console.log('✅ Connecté, URL actuelle:', page.url());

  // Si on n'est pas déjà sur la page d'invitation, on y va
  if (!page.url().includes('/dossiers/inviter')) {
    await page.goto('/fr/dossiers/inviter');
    await page.waitForLoadState('networkidle');
  }

  // Remplir le formulaire
  await page.locator('input[type="email"]').fill('morosidibepro@gmail.com');
  await page.locator('select').selectOption('RECOURS_OQTF');
  await page.locator('input[type="text"]').fill('Démo - OQTF');

  // Soumettre
  await page.getByRole('button', { name: /Créer et inviter/i }).click();
  
  // Attendre le succès
  await expect(page.getByText(/Invitation créée|Invitation envoyée/i)).toBeVisible({ timeout: 15000 });
  console.log('✅ PARCOURS VALIDÉ : Invitation en 3 champs !');
});
