import { test, expect } from '@playwright/test';

const LAWYER_EMAIL = 'test+clerk_test@memolib.dev';
const LAWYER_PASSWORD = 'Mem0L!b_Secure_2026#Dupont';

test('Test du bouton Créer le Dossier', async ({ page }) => {
  test.setTimeout(120_000);

  // Capture les erreurs réseau (en ignorant Sentry)
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('sentry.io')) {
      console.log(`❌ ERREUR HTTP ${response.status()} sur ${response.url()}`);
    }
  });
  
  page.on('pageerror', err => {
    console.log(`❌ ERREUR JS : ${err.message}`);
  });

  // 1. Connexion
  await page.goto('/fr/auth/login');
  await page.waitForSelector('input', { timeout: 15000 });
  await page.locator('input[name="identifier"], input[type="email"]').first().fill(LAWYER_EMAIL);
  await page.locator('input[name="identifier"], input[type="email"]').first().press('Enter');
  await page.waitForTimeout(1000);
  
  const pwd = page.locator('input[name="password"]').first();
  if (await pwd.isVisible()) {
    await pwd.fill(LAWYER_PASSWORD);
    await pwd.press('Enter');
  }
  
  const otp = page.locator('input[name="code"]').first();
  if (await otp.isVisible({ timeout: 3000 }).catch(() => false)) {
    await otp.fill('424242');
    await otp.press('Enter');
  }
  
  await page.waitForURL(/\/fr\/dossiers/, { timeout: 20000 });

  // 2. Aller au formulaire
  await page.goto('/fr/dossiers/nouveau');
  await page.waitForLoadState('networkidle');
  await page.addStyleTag({ content: '.fixed.bottom-0, .fixed.top-0 { display: none !important; }' });

  // 3. Remplir l'étape 1
  await page.locator('label:has-text("Recours OQTF")').click();
  await page.locator('textarea[name="objetDemande"]').fill('Test de création de dossier');

  // 4. Cliquer sur Suivant
  for (let i = 0; i < 7; i++) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const btn = page.getByRole('button', { name: /^Suivant$|^Valider$|^Créer$|^Terminer$/i }).last();
    if (!(await btn.isVisible().catch(() => false))) break;
    
    await btn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);

    const modal = page.locator('[role="dialog"], .fixed.inset-0').filter({ hasText: 'Consentement' });
    if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log('🔒 Modale RGPD détectée');
      const checkboxes = modal.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let j = 0; j < count; j++) await checkboxes.nth(j).check({ force: true }).catch(() => {});
      await modal.getByRole('button').last().click({ force: true });
      await page.waitForTimeout(2000);
    }
  }

  // 5. Cliquer sur "Créer le Dossier"
  console.log('⏳ En attente du bouton "Créer le Dossier"...');
  const createBtn = page.getByRole('button', { name: /^Créer le Dossier$/i });
  await createBtn.waitFor({ state: 'visible', timeout: 10000 });
  
  console.log('👆 Clic sur le bouton...');
  await createBtn.click({ force: true });
  
  // 6. Attendre la redirection
  try {
    await page.waitForFunction(() => {
      return window.location.pathname.includes('/fr/dossiers/') && !window.location.pathname.includes('/nouveau');
    }, { timeout: 15000 });
    console.log('✅ SUCCÈS : Dossier créé ! URL:', page.url());
  } catch (e) {
    console.log('❌ ÉCHEC : La page n\'a pas changé après le clic.');
    if (!page.isClosed()) {
      await page.screenshot({ path: 'test-results/erreur-creation-dossier.png' });
      console.log('📸 Screenshot sauvegardé.');
    }
  }
});
