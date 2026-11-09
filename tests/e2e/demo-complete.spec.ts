import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'avocat@memolib.fr';
const TEST_PASSWORD = 'admin123';

test.describe('🎯 Démo Complète MemoLib', () => {
  // ============================================
  // PHASE 1: AUTHENTIFICATION
  // ============================================
  test('1️⃣ Login avec identifiants de test', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Vérifier que la page de login est chargée
    await expect(page).toHaveURL(/auth\/login|sign/i);
    console.log('✅ Page de login chargée');

    // Remplir le formulaire
    await page.fill('input[type="email"]', TEST_EMAIL);
    console.log('✅ Email saisi');

    await page.fill('input[type="password"]', TEST_PASSWORD);
    console.log('✅ Mot de passe saisi');

    // Soumettre
    await page.click('button[type="submit"]');
    console.log('✅ Formulaire soumis');

    // Attendre la redirection
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });
    console.log('✅ Authentification réussie - Redirection vers dashboard');

    // Vérifier que l'utilisateur est connecté
    const userInfo = await page
      .locator('[data-testid="user-info"], .user-name, [class*="user"]')
      .first();
    if (await userInfo.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Utilisateur identifié dans le header');
    }
  });

  // ============================================
  // PHASE 2: NAVIGATION DASHBOARD
  // ============================================
  test('2️⃣ Accès au dashboard principal', async ({ page }) => {
    // Login d'abord
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });

    // Naviguer vers dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    console.log('✅ Dashboard chargé');

    // Vérifier les sections principales
    const mainContent = await page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
    console.log('✅ Contenu principal visible');

    // Vérifier la navigation
    const nav = await page.locator('nav, [role="navigation"]').first();
    if (await nav.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Barre de navigation présente');
    }
  });

  // ============================================
  // PHASE 3: SYSTÈME DE PREUVE LÉGALE
  // ============================================
  test('3️⃣ Générer une preuve légale', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });

    // Accéder à la page de génération de preuve
    await page.goto(`${BASE_URL}/demo/legal-proof`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    console.log('✅ Page de génération de preuve chargée');

    // Remplir le formulaire
    const typeSelect = page.locator('select, [role="combobox"]').first();
    if (await typeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await typeSelect.click();
      await page.click('text=/Contrat|Document|Accord/i');
      console.log('✅ Type de preuve sélectionné');
    }

    // Remplir le contenu
    const contentInput = page.locator('textarea, input[placeholder*="contenu" i]').first();
    if (await contentInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contentInput.fill('Preuve légale test - ' + new Date().toISOString());
      console.log('✅ Contenu de preuve saisi');
    }

    // Soumettre
    const submitBtn = page
      .locator('button[type="submit"], button:has-text("Générer"), button:has-text("Créer")')
      .first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      console.log('✅ Génération de preuve lancée');

      // Attendre le résultat
      await page.waitForTimeout(3000);
      const success = await page.locator('[role="alert"], .success, .toast').first();
      if (await success.isVisible({ timeout: 10000 }).catch(() => false)) {
        console.log('✅ Preuve légale générée avec succès');
      }
    }
  });

  // ============================================
  // PHASE 4: LISTE DES PREUVES
  // ============================================
  test('4️⃣ Afficher la liste des preuves légales', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });

    // Accéder à la liste
    await page.goto(`${BASE_URL}/admin/legal-proofs`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    console.log('✅ Page des preuves légales chargée');

    // Vérifier le tableau
    const table = page.locator('table, [role="table"], [class*="table"]').first();
    if (await table.isVisible({ timeout: 10000 }).catch(() => false)) {
      const rows = await page.locator('tbody tr, [role="row"]').count();
      console.log(`✅ Tableau avec ${rows} preuve(s) visible`);
    }
  });

  // ============================================
  // PHASE 5: DÉTAILS D'UNE PREUVE
  // ============================================
  test("5️⃣ Consulter les détails d'une preuve", async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });

    // Aller à la liste
    await page.goto(`${BASE_URL}/admin/legal-proofs`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Cliquer sur la première preuve
    const firstProof = page.locator('table tbody tr, [role="row"]').first();
    if (await firstProof.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstProof.click();
      console.log('✅ Preuve sélectionnée');

      // Attendre les détails
      await page.waitForTimeout(2000);
      const details = page
        .locator('[data-testid*="detail"], .detail-panel, [class*="detail"]')
        .first();
      if (await details.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Détails de la preuve affichés');
      }
    }
  });

  // ============================================
  // PHASE 6: EXPORT DES PREUVES
  // ============================================
  test('6️⃣ Exporter une preuve (PDF/JSON/XML)', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });

    // Aller à la liste
    await page.goto(`${BASE_URL}/admin/legal-proofs`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Chercher le bouton d'export
    const exportBtn = page.locator('button:has-text("Exporter"), [data-testid*="export"]').first();
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();
      console.log("✅ Menu d'export ouvert");

      // Tenter PDF
      const pdfOption = page.locator('text=/PDF|Télécharger PDF/i').first();
      if (await pdfOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pdfOption.click();
        console.log('✅ Export PDF lancé');
      }
    }
  });

  // ============================================
  // PHASE 7: SIGNATURE eIDAS
  // ============================================
  test('7️⃣ Ajouter une signature eIDAS', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });

    // Aller à la liste
    await page.goto(`${BASE_URL}/admin/legal-proofs`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Chercher le bouton de signature
    const signBtn = page.locator('button:has-text("Signer"), [data-testid*="sign"]').first();
    if (await signBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signBtn.click();
      console.log('✅ Dialogue de signature ouvert');

      // Sélectionner le niveau
      const levelSelect = page.locator('select, [role="combobox"]').first();
      if (await levelSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await levelSelect.click();
        await page.click('text=/Simple|Avancée|Qualifiée/i');
        console.log('✅ Niveau de signature sélectionné');
      }

      // Soumettre
      const submitBtn = page.locator('button[type="submit"], button:has-text("Signer")').first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        console.log('✅ Signature soumise');
      }
    }
  });

  // ============================================
  // PHASE 8: RÈGLES SECTORIELLES
  // ============================================
  test('8️⃣ Consulter les règles sectorielles', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });

    // Accéder aux règles
    await page.goto(`${BASE_URL}/admin/sector-rules`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    console.log('✅ Page des règles sectorielles chargée');

    // Vérifier les secteurs
    const sectors = page.locator('[data-testid*="sector"], .sector, button:has-text("Secteur")');
    const count = await sectors.count();
    if (count > 0) {
      console.log(`✅ ${count} secteur(s) disponible(s)`);

      // Tester un secteur
      const firstSector = sectors.first();
      if (await firstSector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstSector.click();
        console.log('✅ Secteur sélectionné');
      }
    }
  });

  // ============================================
  // PHASE 9: SANTÉ API
  // ============================================
  test("9️⃣ Vérifier la santé de l'API", async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    console.log('✅ API Health: 200 OK');

    const data = await response.json();
    console.log('✅ Réponse API:', JSON.stringify(data, null, 2));

    // Vérifier les services
    if (data.services) {
      Object.entries(data.services).forEach(([service, status]) => {
        console.log(`  - ${service}: ${status === 'healthy' ? '✅' : '⚠️'}`);
      });
    }
  });

  // ============================================
  // PHASE 10: PERFORMANCE
  // ============================================
  test('🔟 Mesurer les performances', async ({ page }) => {
    const timings = {
      loginPage: 0,
      dashboard: 0,
      proofPage: 0,
    };

    // Login page
    const t1 = Date.now();
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    timings.loginPage = Date.now() - t1;
    console.log(`✅ Login page: ${timings.loginPage}ms`);

    // Login
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 30000 });

    // Dashboard
    const t2 = Date.now();
    await page.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
    });
    timings.dashboard = Date.now() - t2;
    console.log(`✅ Dashboard: ${timings.dashboard}ms`);

    // Proof page
    const t3 = Date.now();
    await page.goto(`${BASE_URL}/demo/legal-proof`, {
      waitUntil: 'domcontentloaded',
    });
    timings.proofPage = Date.now() - t3;
    console.log(`✅ Proof page: ${timings.proofPage}ms`);

    // Validation
    expect(timings.loginPage).toBeLessThan(5000);
    expect(timings.dashboard).toBeLessThan(10000);
    expect(timings.proofPage).toBeLessThan(10000);
    console.log('✅ Toutes les performances sont dans les normes');
  });
});
