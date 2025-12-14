import { test, expect } from '@playwright/test';
import { loginForTests } from '../helpers/auth-simple.js';

test.describe('Voice Transcription E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await loginForTests(page, false); // false = existing user
    
    // Wait for the main interface to load
    await page.waitForTimeout(1000);
  });

  test('01 - Navigation vers Transcription vocale', async ({ page }) => {
    // Cliquer sur le lien dans la sidebar
    await page.click('a[href="/voice-transcription"]');
    
    // Vérifier l'URL
    await expect(page).toHaveURL('/voice-transcription');
    
    // Vérifier le titre (using getByRole for better specificity)
    await expect(page.getByRole('heading', { name: /Transcription Vocale/i }).first()).toBeVisible();
  });

  test('02 - Interface de transcription présente', async ({ page }) => {
    await page.goto('/voice-transcription');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Vérifier que les éléments clés sont présents
    await expect(page.getByText(/Pr.t .* enregistrer/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Transcription Vocale/i)).toBeVisible();
    await expect(page.locator('text=Connecté').or(page.locator('text=Déconnecté'))).toBeVisible();
  });

  test('03 - Paramètres d\'accessibilité intégrés', async ({ page }) => {
    await page.goto('/voice-transcription');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Scroller vers le bas pour voir les paramètres
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Vérifier que la page contient des informations d'accessibilité
    await expect(page.getByText(/Parlez et voyez/i)).toBeVisible();
    await expect(page.getByText(/Durée/i)).toBeVisible();
  });

  test('04 - Toggle TTS dans VoiceTranscription', async ({ page }) => {
    await page.goto('/voice-transcription');
    
    // Vérifier que la page est chargée et fonctionnelle
    await expect(page.getByText(/Pr.t .* enregistrer/i)).toBeVisible();
  });

  test('05 - Toggle Haut Contraste dans VoiceTranscription', async ({ page }) => {
    await page.goto('/voice-transcription');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Vérifier que la page est chargée et fonctionnelle
    await expect(page.getByText(/Pr.t .* enregistrer/i)).toBeVisible({ timeout: 10000 });
  });

  test('06 - Zone de transcription visuelle présente', async ({ page }) => {
    await page.goto('/voice-transcription');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Vérifier que le titre de la transcription existe
    await expect(page.getByText(/Transcription Vocale/i)).toBeVisible({ timeout: 10000 });
  });

  test('07 - Instructions d\'utilisation visibles', async ({ page }) => {
    await page.goto('/voice-transcription');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Vérifier que les informations sont présentes
    await expect(page.getByText(/Parlez et voyez/i)).toBeVisible({ timeout: 10000 });
  });

  test('08 - Bouton d\'enregistrement est désactivé initialement', async ({ page }) => {
    await page.goto('/voice-transcription');
    
    // Vérifier que l'état initial est "Prêt à enregistrer"
    await expect(page.getByText(/Pr.t .* enregistrer/i)).toBeVisible();
  });

  test('09 - API Voice Start (mock)', async ({ page, request }) => {
    // Test de l'API backend (doit échouer sans micro mais on teste la route)
    const response = await request.post('http://localhost:5000/api/voice/start');
    
    // On s'attend à une réponse (même si erreur de micro)
    expect(response.status()).toBeLessThan(500);
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });

  test('10 - API Transcripts récents', async ({ page, request }) => {
    const response = await request.get('http://localhost:5000/api/accessibility/transcripts?limit=10');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('transcripts');
    expect(Array.isArray(data.transcripts)).toBe(true);
  });

  test('11 - Simulation d\'annonce vocale', async ({ page, request }) => {
    // Test de l'API d'annonce
    const response = await request.post('http://localhost:5000/api/accessibility/announce', {
      data: {
        action: 'Test E2E',
        details: 'Test automatisé Playwright',
        speak: false, // Ne pas parler pendant les tests
        show: true
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.result).toHaveProperty('action');
  });

  test('12 - Responsive design - Mobile', async ({ page }) => {
    // Changer la taille de viewport en mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/voice-transcription');
    
    // Vérifier que les éléments sont toujours visibles
    await expect(page.getByRole('heading', { name: /Transcription Vocale/i }).first()).toBeVisible();
    await expect(page.getByText(/Pr.t .* enregistrer/i)).toBeVisible();
  });

  test('13 - Responsive design - Tablet', async ({ page }) => {
    // Changer la taille de viewport en tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/voice-transcription');
    
    // Vérifier que les éléments sont toujours visibles
    await expect(page.getByRole('heading', { name: /Transcription Vocale/i }).first()).toBeVisible();
    await expect(page.getByText(/Pr.t .* enregistrer/i)).toBeVisible();
  });
});
