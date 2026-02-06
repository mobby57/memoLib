/**
 * Tests E2E Playwright - Système de Preuve Légale
 *
 * Workflow complet:
 * 1. Générer une preuve
 * 2. Vérifier son intégrité
 * 3. Exporter en JSON/PDF/XML
 * 4. Ajouter une signature
 * 5. Vérifier dans l'admin
 */

import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Système de Preuve Légale - Workflow Complet', () => {
  test.beforeEach(async ({ page }) => {
    // Note: authentification à configurer si NextAuth actif
    await page.goto(BASE_URL);
  });

  test('Workflow complet: Générer → Vérifier → Exporter → Signer', async ({ page }) => {
    // 1. Aller sur la page de démo
    await page.goto(`${BASE_URL}/demo/legal-proof`);
    await expect(page.locator('h1')).toContainText('Démo');

    // 2. Générer une nouvelle preuve
    await page.click('button:has-text("Générer Nouvelle Preuve")');

    // Attendre que le modal s'ouvre
    await page.waitForSelector('[data-testid="proof-modal"]', { timeout: 5000 });

    // Remplir le formulaire
    await page.fill('input[name="reason"]', 'Test E2E - Preuve automatique');
    await page.selectOption('select[name="type"]', 'DOCUMENT');
    await page.fill('input[name="jurisdiction"]', 'FR');
    await page.check('input[name="includeTimestamp"]');

    // Soumettre
    await page.click('button:has-text("Générer")');

    // Attendre la génération
    await page.waitForSelector('[data-testid="proof-generated"]', { timeout: 10000 });

    // Récupérer l'ID de la preuve
    const proofId = await page.locator('[data-testid="proof-id"]').textContent();
    expect(proofId).toBeTruthy();
    expect(proofId).toMatch(/^proof_/);

    // 3. Vérifier la preuve
    await page.click('text="Vérifier"');
    await page.fill('input[name="proofId"]', proofId!);
    await page.click('button:has-text("Vérifier Preuve")');

    // Attendre les résultats de vérification
    await page.waitForSelector('[data-testid="verification-result"]', { timeout: 5000 });

    // Vérifier les 5 points de contrôle
    await expect(page.locator('[data-testid="check-hash"]')).toContainText('✓');
    await expect(page.locator('[data-testid="check-signatures"]')).toContainText('✓');
    await expect(page.locator('[data-testid="check-timestamp"]')).toContainText('✓');
    await expect(page.locator('[data-testid="check-audit"]')).toContainText('✓');
    await expect(page.locator('[data-testid="check-expiration"]')).toContainText('✓');

    // 4. Tester les exports

    // Export JSON
    const [downloadJSON] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("JSON")'),
    ]);
    expect(downloadJSON.suggestedFilename()).toContain('.json');

    // Export PDF
    const [downloadPDF] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("PDF")'),
    ]);
    expect(downloadPDF.suggestedFilename()).toContain('.pdf');

    // Export XML
    const [downloadXML] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("XML")'),
    ]);
    expect(downloadXML.suggestedFilename()).toContain('.xml');

    // 5. Ajouter une signature
    await page.click('button:has-text("Ajouter Signature")');
    await page.fill('input[name="signerName"]', 'Avocat Test E2E');
    await page.fill('input[name="signerEmail"]', 'avocat.test@e2e.fr');
    await page.selectOption('select[name="signatureType"]', 'ADVANCED');
    await page.click('button:has-text("Signer")');

    await page.waitForSelector('[data-testid="signature-added"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="signatures-count"]')).toContainText('1');

    // 6. Vérifier dans l'admin
    await page.goto(`${BASE_URL}/admin/legal-proofs`);

    // Rechercher la preuve
    await page.fill('input[placeholder*="Rechercher"]', proofId!);
    await page.waitForTimeout(500); // Attendre le debounce de recherche

    // Vérifier qu'elle apparaît
    await expect(page.locator(`[data-proof-id="${proofId}"]`)).toBeVisible();
    await expect(page.locator(`[data-proof-id="${proofId}"]`)).toContainText('Test E2E');
    await expect(page.locator(`[data-proof-id="${proofId}"]`)).toContainText('1 signature');
  });

  test('Validation des champs obligatoires', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo/legal-proof`);
    await page.click('button:has-text("Générer Nouvelle Preuve")');

    // Essayer de soumettre sans remplir
    await page.click('button:has-text("Générer")');

    // Vérifier les messages d'erreur
    await expect(page.locator('text="Raison obligatoire"')).toBeVisible();
  });

  test('Détection de preuve modifiée', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo/legal-proof`);

    // Créer une preuve
    await page.click('button:has-text("Générer Nouvelle Preuve")');
    await page.fill('input[name="reason"]', 'Test modification');
    await page.click('button:has-text("Générer")');

    const proofId = await page.locator('[data-testid="proof-id"]').textContent();

    // TODO: Simuler une modification du document sous-jacent
    // puis vérifier que la vérification échoue

    // Pour le moment, vérifier qu'une preuve invalide est détectée
    await page.click('text="Vérifier"');
    await page.fill('input[name="proofId"]', 'proof_invalid_12345');
    await page.click('button:has-text("Vérifier Preuve")');

    await page.waitForSelector('[data-testid="verification-error"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="verification-error"]')).toContainText('non trouvée');
  });

  test('Filtres admin - Par type', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/legal-proofs`);

    // Cliquer sur filtre DOCUMENT
    await page.click('button:has-text("DOCUMENT")');

    // Vérifier que seules les preuves DOCUMENT sont affichées
    const proofs = await page.locator('[data-proof-type]').all();
    for (const proof of proofs) {
      const type = await proof.getAttribute('data-proof-type');
      expect(type).toBe('DOCUMENT');
    }
  });

  test('Filtres admin - Par validité', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/legal-proofs`);

    // Cliquer sur filtre VALID
    await page.click('button:has-text("Valides uniquement")');

    // Vérifier que seules les preuves valides sont affichées
    const badges = await page.locator('[data-testid="proof-badge"]').all();
    for (const badge of badges) {
      await expect(badge).toContainText('Valide');
    }
  });

  test('Page règles sectorielles - Navigation et filtres', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/sector-rules`);

    // Vérifier le titre
    await expect(page.locator('h1')).toContainText('Règles');

    // Vérifier les stats
    const totalRules = await page.locator('[data-testid="total-rules"]').textContent();
    expect(parseInt(totalRules!)).toBeGreaterThan(0);

    // Filtrer par secteur LEGAL
    await page.click('button:has-text("LEGAL")');

    // Vérifier que seules les règles LEGAL sont affichées
    const rules = await page.locator('[data-sector]').all();
    for (const rule of rules) {
      const sector = await rule.getAttribute('data-sector');
      expect(sector).toBe('LEGAL');
    }

    // Rechercher une règle spécifique
    await page.fill('input[placeholder*="Rechercher"]', 'Recours');
    await page.waitForTimeout(300);

    const searchResults = await page.locator('[data-testid="rule-card"]').all();
    expect(searchResults.length).toBeGreaterThan(0);

    for (const result of searchResults) {
      const text = await result.textContent();
      expect(text?.toLowerCase()).toContain('recours');
    }
  });

  test('Export multiple formats - Validation contenu', async ({ page }) => {
    await page.goto(`${BASE_URL}/demo/legal-proof`);

    // Générer une preuve
    await page.click('button:has-text("Générer Nouvelle Preuve")');
    await page.fill('input[name="reason"]', 'Test export formats');
    await page.fill('input[name="jurisdiction"]', 'FR');
    await page.click('button:has-text("Générer")');

    const proofId = await page.locator('[data-testid="proof-id"]').textContent();

    // Export JSON et vérifier le contenu
    const [downloadJSON] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("JSON")'),
    ]);

    const jsonPath = await downloadJSON.path();
    const fs = require('fs');
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath!, 'utf-8'));

    expect(jsonContent.id).toBe(proofId);
    expect(jsonContent.type).toBe('DOCUMENT');
    expect(jsonContent.documentHash).toBeTruthy();
    expect(jsonContent.timestamp).toBeTruthy();
  });

  test('API endpoints - Tests directs', async ({ request }) => {
    // Test POST /api/legal/proof/generate
    const generateResponse = await request.post(`${BASE_URL}/api/legal/proof/generate`, {
      data: {
        type: 'DOCUMENT',
        tenantId: 'test-tenant',
        entityId: 'test-entity',
        entityType: 'dossier',
        createdBy: 'test-user',
        reason: 'API E2E Test',
        jurisdiction: 'FR',
      },
    });

    expect(generateResponse.ok()).toBeTruthy();
    const generateData = await generateResponse.json();
    expect(generateData.success).toBe(true);
    expect(generateData.proof.id).toBeTruthy();

    const proofId = generateData.proof.id;

    // Test GET /api/legal/proof/verify
    const verifyResponse = await request.get(
      `${BASE_URL}/api/legal/proof/verify?proofId=${proofId}`
    );

    expect(verifyResponse.ok()).toBeTruthy();
    const verifyData = await verifyResponse.json();
    expect(verifyData.isValid).toBe(true);

    // Test GET /api/legal/proof/list
    const listResponse = await request.get(`${BASE_URL}/api/legal/proof/list`);
    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();
    expect(listData.proofs).toBeDefined();
    expect(Array.isArray(listData.proofs)).toBe(true);
  });
});

test.describe('Règles Sectorielles', () => {
  test('Affichage de toutes les règles', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/sector-rules`);

    // Vérifier que chaque secteur a au moins une règle
    const sectors = ['LEGAL', 'MDPH', 'MEDICAL', 'ADMIN', 'GENERAL'];

    for (const sector of sectors) {
      await page.click(`button:has-text("${sector}")`);
      const rules = await page.locator('[data-testid="rule-card"]').count();
      expect(rules).toBeGreaterThan(0);
    }
  });

  test('Vérification des informations de règle', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/sector-rules`);

    // Sélectionner première règle
    const firstRule = page.locator('[data-testid="rule-card"]').first();

    // Vérifier présence des champs obligatoires
    await expect(firstRule.locator('[data-testid="rule-deadline"]')).toBeVisible();
    await expect(firstRule.locator('[data-testid="rule-legal-basis"]')).toBeVisible();
    await expect(firstRule.locator('[data-testid="rule-proofs"]')).toBeVisible();
    await expect(firstRule.locator('[data-testid="rule-retention"]')).toBeVisible();
  });
});
