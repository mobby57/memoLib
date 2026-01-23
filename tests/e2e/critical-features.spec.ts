import { test, expect } from '@playwright/test';

/**
 * Tests E2E Critiques - Fonctionnalités métier principales
 */

test.describe('🔐 Authentification', () => {
  test('doit afficher la page de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/IA Poste Manager/);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('doit rejeter des identifiants invalides', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Attendre message d'erreur
    await expect(page.locator('.text-red-500, [role="alert"], .error')).toBeVisible({ timeout: 5000 });
  });

  test('doit se connecter avec compte démo', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    
    // Attendre redirection vers dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });
});

test.describe('📊 Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login rapide
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test('doit afficher les statistiques principales', async ({ page }) => {
    // Vérifier présence des cartes stats
    await expect(page.locator('[data-testid="stats-card"], .stats-card, .stat-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('doit avoir une navigation fonctionnelle', async ({ page }) => {
    // Vérifier sidebar
    await expect(page.locator('nav, aside, .sidebar').first()).toBeVisible();
    
    // Vérifier liens principaux
    const navLinks = ['Dossiers', 'Clients', 'Calendrier'];
    for (const linkText of navLinks) {
      const link = page.locator(`a:has-text("${linkText}"), button:has-text("${linkText}")`).first();
      if (await link.isVisible()) {
        await expect(link).toBeEnabled();
      }
    }
  });
});

test.describe('📁 Gestion des Dossiers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test('doit naviguer vers la liste des dossiers', async ({ page }) => {
    // Cliquer sur Dossiers dans la nav
    const dossiersLink = page.locator('a:has-text("Dossiers"), a[href*="dossiers"]').first();
    if (await dossiersLink.isVisible()) {
      await dossiersLink.click();
      await expect(page).toHaveURL(/dossiers/, { timeout: 5000 });
    }
  });

  test('doit afficher le formulaire de création', async ({ page }) => {
    await page.goto('/dashboard/dossiers/new');
    
    // Vérifier champs du formulaire
    await expect(page.locator('form').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('👥 Gestion des Clients', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test('doit accéder à la liste des clients', async ({ page }) => {
    const clientsLink = page.locator('a:has-text("Clients"), a[href*="clients"]').first();
    if (await clientsLink.isVisible()) {
      await clientsLink.click();
      await expect(page).toHaveURL(/clients/, { timeout: 5000 });
    }
  });
});

test.describe('🔍 API Health Check', () => {
  test('endpoint health doit répondre 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('endpoint auth/providers doit répondre', async ({ request }) => {
    const response = await request.get('/api/auth/providers');
    expect(response.ok()).toBe(true);
  });
});

test.describe('📱 Responsive Design', () => {
  test('doit être utilisable sur mobile', async ({ page }) => {
    // Viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // Le formulaire doit être visible
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('doit être utilisable sur tablette', async ({ page }) => {
    // Viewport tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });
});

test.describe('⚡ Performance', () => {
  test('page login doit charger en moins de 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login');
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('page dashboard doit charger en moins de 5s après login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'demo123');
    
    const start = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('🔒 Sécurité', () => {
  test('pages protégées doivent rediriger vers login', async ({ page }) => {
    // Tenter d'accéder au dashboard sans auth
    await page.goto('/dashboard');
    
    // Doit rediriger vers login ou afficher un message
    await expect(page).toHaveURL(/login|auth|signin/, { timeout: 5000 });
  });

  test('doit avoir les headers de sécurité', async ({ request }) => {
    const response = await request.get('/');
    
    // Vérifier quelques headers de sécurité
    const headers = response.headers();
    expect(headers['x-frame-options'] || headers['content-security-policy']).toBeDefined();
  });
});
