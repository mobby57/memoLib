import { test, expect } from '@playwright/test';

const LAWYER_EMAIL = 'test+clerk_test@memolib.dev';
const LAWYER_PASSWORD = 'Mem0L!b_Secure_2026#Dupont';
const CLIENT_EMAIL = 'client-test+clerk_test@memolib.dev';
const CLIENT_PASSWORD = 'Mem0L!b_Secure_2026#Client';

async function clerkLogin(page: any, email: string, password: string) {
  await page.goto('/fr/auth/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[name="identifier"], input[type="email"], input[type="text"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(email);
  await emailInput.press('Enter');
  await page.waitForTimeout(1500);

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  if (await passwordInput.isVisible().catch(() => false)) {
    await passwordInput.fill(password);
    await passwordInput.press('Enter');
    await page.waitForTimeout(1500);
  }

  const otpInput = page.locator('input[name="code"], input[autocomplete="one-time-code"]').first();
  if (await otpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await otpInput.fill('424242');
    await otpInput.press('Enter');
  }

  await page.waitForURL(/\/fr\/(dossiers|dashboard|espace-client)/, { timeout: 20000 });
}

test('Parcours Démo : Blanvillain', async ({ browser }) => {
  test.setTimeout(300_000); // 5 minutes max

  const lawyerContext = await browser.newContext();
  const lawyerPage = await lawyerContext.newPage();
  let inviteLink = '';

  // ACTE 1 : L'AVOCAT
  await test.step('1. Avocat : Connexion', async () => {
    console.log('🔑 Connexion Avocat...');
    await clerkLogin(lawyerPage, LAWYER_EMAIL, LAWYER_PASSWORD);
    console.log('✅ Avocat connecté');
  });

  await test.step('2. Avocat : Création du dossier OQTF', async () => {
    await lawyerPage.goto('/fr/dossiers/nouveau');
    await lawyerPage.waitForLoadState('networkidle');
    
    await lawyerPage.addStyleTag({ content: '.fixed.bottom-0, .fixed.top-0 { display: none !important; }' });
    await lawyerPage.locator('label:has-text("Recours OQTF")').click();
    await lawyerPage.locator('textarea[name="objetDemande"]').fill('OQTF du 12/10/2026 - Procédure d\'urgence');
    
    // Avance dans les 7 étapes
    for (let i = 0; i < 7; i++) {
      await lawyerPage.evaluate(() => window.scrollTo(0, 0));
      await lawyerPage.waitForTimeout(500);
      
      const btn = lawyerPage.getByRole('button', { name: /^Suivant$|^Valider$|^Créer$|^Terminer$/i }).last();
      if (!(await btn.isVisible().catch(() => false))) break;
      
      await btn.click({ force: true }).catch(() => {});
      await lawyerPage.waitForTimeout(1000);

      // GESTION INTELLIGENTE DE LA MODALE RGPD
      const consentModal = lawyerPage.locator('[role="dialog"], .fixed.inset-0').filter({ hasText: 'Consentement' });
      if (await consentModal.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log('🔒 Modale RGPD détectée → validation...');
        const checkboxes = consentModal.locator('input[type="checkbox"]');
        const count = await checkboxes.count();
        for (let j = 0; j < count; j++) {
          await checkboxes.nth(j).check({ force: true }).catch(() => {});
        }
        
        // Clique sur le bouton de validation DANS la modale
        const validateBtn = consentModal.getByRole('button').last();
        await validateBtn.click({ force: true });
        await lawyerPage.waitForTimeout(2000);
      }
    }
    
    // ✅ FIX : Attendre que l'URL ne soit PLUS 'nouveau'
    await lawyerPage.waitForFunction(() => {
      return window.location.pathname.includes('/fr/dossiers/') && !window.location.pathname.includes('/nouveau');
    }, { timeout: 20000 });
    
    console.log('✅ Dossier créé, URL:', lawyerPage.url());
  });

  await test.step('3. Avocat : Invitation', async () => {
    console.log('🔗 Ouverture de la modale d\'invitation...');
    // Attends que le bouton apparaisse au cas où le chargement serait lent
    const inviteBtn = lawyerPage.getByRole('button', { name: /Inviter un client/i });
    await inviteBtn.waitFor({ state: 'visible', timeout: 15000 });
    await inviteBtn.click();
    
    await lawyerPage.getByPlaceholder('client@email.com').fill(CLIENT_EMAIL);
    await lawyerPage.getByRole('button', { name: /Générer le lien/i }).click();
    
    const linkInput = lawyerPage.locator('input[readonly]');
    await expect(linkInput).toBeVisible({ timeout: 5000 });
    inviteLink = await linkInput.inputValue();
    console.log(`✅ Lien généré : ${inviteLink}`);
  });

  // ACTE 2 : LE CLIENT
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();

  await test.step('4. Client : Connexion via lien', async () => {
    console.log('👤 Le client clique sur le lien...');
    await clientPage.goto(inviteLink);
    await clientPage.waitForLoadState('networkidle');
    await clientPage.waitForTimeout(2000);

    if (clientPage.url().includes('/auth/login') || clientPage.url().includes('/sign-in')) {
      await clerkLogin(clientPage, CLIENT_EMAIL, CLIENT_PASSWORD);
      await clientPage.goto(inviteLink);
    }
    await expect(clientPage.getByText('Espace Client Sécurisé')).toBeVisible({ timeout: 15000 });
    console.log('✅ Client connecté à son espace');
  });

  await test.step('5. Client : Intake + Upload', async () => {
    await clientPage.locator('input[type="text"]').nth(0).fill('Dupont');
    await clientPage.locator('input[type="text"]').nth(1).fill('Marie');
    await clientPage.locator('input[type="text"]').nth(2).fill('12 rue de la Paix, 57000 Metz');
    await clientPage.locator('textarea').fill('Je suis arrivée en France en 2024. J\'ai reçu une OQTF le mois dernier.');
    
    await clientPage.getByRole('button', { name: /Transmettre à mon avocat/i }).click();
    await clientPage.waitForTimeout(2000);

    const fakePdf = Buffer.from('%PDF-1.4\n%fake pdf\n');
    await clientPage.setInputFiles('input[type="file"]', { name: 'passeport.pdf', mimeType: 'application/pdf', buffer: fakePdf });
    await expect(clientPage.getByText('Fichier chiffré')).toBeVisible({ timeout: 15000 });
    console.log('✅ Document chiffré uploadé');
  });

  // ACTE 3 : RETOUR AVOCAT
  await test.step('6. Avocat : Vérification du dossier', async () => {
    console.log('🔍 L\'avocat vérifie le dossier...');
    await lawyerPage.reload();
    await lawyerPage.waitForLoadState('networkidle');
    await expect(lawyerPage.getByText(/Dupont/i).first()).toBeVisible({ timeout: 10000 });
    console.log('\n🏆 DÉMO VALIDÉE AVEC SUCCÈS !\n');
  });

  await lawyerContext.close();
  await clientContext.close();
});
