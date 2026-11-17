import { test, expect } from '@playwright/test';

const LAWYER_EMAIL = 'test+clerk_test@memolib.dev';
const LAWYER_PASSWORD = 'Mem0L!b_Secure_2026#Dupont';
const CLIENT_EMAIL = 'client-test+clerk_test@memolib.dev';
const CLIENT_PASSWORD = 'Mem0L!b_Secure_2026#Client';

// Fonction de login robuste (gère multi-étapes + OTP + password)
async function clerkLogin(page: any, email: string, password: string) {
  await page.goto('/fr/auth/login');
  await page.waitForLoadState('networkidle');

  // ÉTAPE 1 : Email
  const emailInput = page.locator('input[type="email"], input[name="identifier"], input[autocomplete="email"]').first();
  await emailInput.waitFor({ timeout: 15000 });
  await emailInput.fill(email);

  // Cherche un bouton "Continuer" OU le champ mot de passe sur la même page
  const continueBtn = page.getByRole('button', { name: /continuer|continue|suivant|next/i }).first();
  const passwordInput = page.locator('input[type="password"]').first();

  // Attends 2s pour voir si le champ mot de passe apparaît directement
  await page.waitForTimeout(2000);

  if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    // CAS A : Email + password sur la même page
    await passwordInput.fill(password);
    await page.getByRole('button', { name: /continuer|se connecter|sign in|valider/i }).first().click();
  } else if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    // CAS B : Multi-étapes (email → puis password/OTP)
    await continueBtn.click();
    await page.waitForTimeout(2000);

    // Re-vérifie si password apparaît après le clic
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill(password);
      await page.getByRole('button', { name: /continuer|se connecter|valider/i }).first().click();
    }
  }

  // ÉTAPE 2 : Gérer l'OTP si demandé (champ avec autocomplete one-time-code)
  await page.waitForTimeout(2000);
  const otpInput = page.locator('input[autocomplete="one-time-code"], input[name*="code"], input[placeholder*="code" i]').first();
  if (await otpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('🔐 OTP demandé → saisie 424242');
    await otpInput.fill('424242');
    await page.getByRole('button', { name: /continuer|valider|verify|confirmer/i }).first().click();
  }

  // Attente de redirection
  await page.waitForURL(/\/fr\/(dossiers|dashboard|espace-client)/, { timeout: 30000 });
}

test('Parcours GAFAM : Avocat invite Client + Upload chiffré', async ({ browser }) => {
  const lawyerContext = await browser.newContext();
  const lawyerPage = await lawyerContext.newPage();
  let inviteLink = '';

  await test.step('1. Connexion Avocat', async () => {
    await clerkLogin(lawyerPage, LAWYER_EMAIL, LAWYER_PASSWORD);
  });

  await test.step('2. Création dossier OQTF', async () => {
    await lawyerPage.goto('/fr/dossiers/nouveau');
    await lawyerPage.waitForLoadState('networkidle');
    await lawyerPage.locator('label:has-text("Recours OQTF")').click();
    await lawyerPage.locator('textarea[name="objetDemande"]').fill('Test E2E - Recours OQTF pour démo');
    
    // Masque la barre fixe en bas qui intercepte les clics
    await lawyerPage.addStyleTag({ content: '.fixed.bottom-0, .fixed.top-0 { display: none !important; }' });

    for (let i = 0; i < 7; i++) {
      // Scroll vers le haut pour éviter les interceptions
      await lawyerPage.evaluate(() => window.scrollTo(0, 0));
      await lawyerPage.waitForTimeout(300);

      const btn = lawyerPage.getByRole('button', { name: /^Suivant$|^Valider$|^Créer$|^Terminer$/i }).last();
      if (!(await btn.isVisible({ timeout: 2000 }).catch(() => false))) break;
      
      // Tente le clic avec force si la barre intercepte encore
      try {
        await btn.click({ timeout: 3000 });
      } catch {
        await btn.click({ force: true, timeout: 3000 });
      }
      await lawyerPage.waitForTimeout(800);
    }
    await lawyerPage.waitForURL(/\/fr\/dossiers\/[a-z0-9-]+/, { timeout: 15000 });
  });

  await test.step('3. Invitation du client', async () => {
    await lawyerPage.getByRole('button', { name: /Inviter un client/i }).click();
    await lawyerPage.getByPlaceholder('client@email.com').fill(CLIENT_EMAIL);
    await lawyerPage.getByRole('button', { name: /Générer l'accès sécurisé/i }).click();
    
    const input = lawyerPage.locator('input[readonly]');
    await expect(input).toBeVisible({ timeout: 5000 });
    inviteLink = await input.inputValue();
    console.log(`\n🔗 Lien d'invitation : ${inviteLink}\n`);
  });

  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();

  await test.step('4. Connexion Client + acceptation', async () => {
    await clientPage.goto(inviteLink);
    await clientPage.waitForLoadState('networkidle');
    await clientPage.addStyleTag({ content: '.fixed.bottom-0, .fixed.top-0 { display: none !important; }' });
    await clientPage.waitForTimeout(2000);

    // Si redirigé vers login, on se connecte
    if (clientPage.url().includes('/auth/login') || clientPage.url().includes('/sign-in')) {
      await clerkLogin(clientPage, CLIENT_EMAIL, CLIENT_PASSWORD);
      await clientPage.goto(inviteLink);
    }

    await expect(clientPage.getByText('Espace Client Sécurisé')).toBeVisible({ timeout: 15000 });
  });

  await test.step('5. Upload chiffré AES-256', async () => {
    const fakePdf = Buffer.from('%PDF-1.4\n%fake\n');
    await clientPage.setInputFiles('input[type="file"]', {
      name: 'justificatif.pdf',
      mimeType: 'application/pdf',
      buffer: fakePdf,
    });
    await expect(clientPage.getByText('Fichier chiffré')).toBeVisible({ timeout: 15000 });
  });

  await lawyerContext.close();
  await clientContext.close();
});
