import { test, expect } from '@playwright/test';

// Variables d'environnement (Senior standard : jamais de credentials en dur dans le test)
const LAWYER_EMAIL = process.env.E2E_LAWYER_EMAIL || 'test@memolib.dev';
const LAWYER_PASSWORD = process.env.E2E_LAWYER_PASSWORD || 'TestPassword123!';
const CLIENT_EMAIL = `client-${Date.now()}@memolib.dev`;
const CLIENT_PASSWORD = 'ClientPassword123!';

test.describe('Parcours GAFAM MemoLib (E2E)', () => {
  test.setTimeout(180_000); // 3 minutes max

  test('Workflow complet : Création dossier -> Invitation -> Chiffrement Client', async ({ browser }) => {
    
    // Création des contextes isolés (Le client ne doit pas avoir les cookies de l'avocat)
    const lawyerContext = await browser.newContext();
    const clientContext = await browser.newContext();
    const lawyerPage = await lawyerContext.newPage();
    const clientPage = await clientContext.newPage();
    
    let inviteLink = '';

    await test.step('Phase 1 : Connexion et création du dossier (Avocat)', async () => {
      await lawyerPage.goto('/fr/auth/login');
      await lawyerPage.getByRole('textbox', { name: /email/i }).fill(LAWYER_EMAIL);
      await lawyerPage.getByRole('textbox', { name: /mot de passe/i }).fill(LAWYER_PASSWORD);
      await lawyerPage.getByRole('button', { name: /se connecter/i }).click();
      
      // Attente de la redirection vers le dashboard
      await lawyerPage.waitForURL('**/fr/dossiers**', { timeout: 15000 });

      await lawyerPage.goto('/fr/dossiers/nouveau');
      await lawyerPage.locator('label:has-text("Recours OQTF")').click();
      await lawyerPage.locator('textarea[name="objetDemande"]').fill('Recours OQTF - Test E2E Automatisé');
      
      // Passage des étapes
      for (let i = 0; i < 7; i++) {
        const nextBtn = lawyerPage.getByRole('button', { name: /^Suivant$|^Valider$|^Créer$|^Enregistrer$/i }).last();
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await lawyerPage.waitForTimeout(300);
        }
      }
      await lawyerPage.waitForURL(/\/fr\/dossiers\/[a-z0-9-]+/, { timeout: 15000 });
    });

    await test.step('Phase 2 : Génération du lien sécurisé (Avocat)', async () => {
      await lawyerPage.getByRole('button', { name: /Inviter un client/i }).click();
      await lawyerPage.getByPlaceholder('client@email.com').fill(CLIENT_EMAIL);
      await lawyerPage.getByRole('button', { name: /Générer l'accès sécurisé/i }).click();
      
      const inviteLinkInput = lawyerPage.locator('input[readonly]');
      await expect(inviteLinkInput).toBeVisible({ timeout: 5000 });
      inviteLink = await inviteLinkInput.inputValue();
    });

    await test.step('Phase 3 : Inscription du client et acceptation (Client)', async () => {
      await clientPage.goto('/fr/auth/login');
      
      // Clerk : Clic sur "Créer un compte"
      await clientPage.getByRole('button', { name: /Créer un compte|Sign up/i }).click();
      await clientPage.getByRole('textbox', { name: /email/i }).fill(CLIENT_EMAIL);
      await clientPage.getByRole('textbox', { name: /mot de passe/i }).fill(CLIENT_PASSWORD);
      await clientPage.getByRole('button', { name: /Continuer|Créer/i }).click();
      
      await clientPage.waitForTimeout(2000); // Laisse Clerk traiter la création
      await clientPage.goto(inviteLink);
      await expect(clientPage.getByText('Espace Client Sécurisé')).toBeVisible({ timeout: 15000 });
    });

    await test.step('Phase 4 : Upload du fichier chiffré (Client)', async () => {
      const fakePdfBuffer = Buffer.from('%PDF-1.4\n%fake pdf content\n');
      await clientPage.setInputFiles('input[type="file"]', {
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fakePdfBuffer,
      });

      // Vérification visuelle du chiffrement (Le cadenas vert)
      await expect(clientPage.getByText('Fichier chiffré')).toBeVisible({ timeout: 15000 });
    });

    await lawyerContext.close();
    await clientContext.close();
  });
});
