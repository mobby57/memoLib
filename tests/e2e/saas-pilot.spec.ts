/**
 * E2E — Parcours Pilote Complet
 * Landing → Inscription → Login → Dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Parcours Pilote SaaS', () => {
  test('la landing page affiche les 4 plans', async ({ page }) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await expect(page.getByText('Essai', { exact: true })).toBeVisible();
    await expect(page.getByText('Essentiel', { exact: true })).toBeVisible();
    await expect(page.getByText('Cabinet', { exact: true })).toBeVisible();
    await expect(page.getByText('Premium', { exact: true })).toBeVisible();
  });

  test('la page pricing affiche les bons prix', async ({ page }) => {
    await page.goto('/pricing', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await expect(page.getByText('Gratuit', { exact: true })).toBeVisible();
    await expect(page.getByText('89€', { exact: true })).toBeVisible();
    await expect(page.getByText('69€', { exact: true })).toBeVisible();
    await expect(page.getByText('149€', { exact: true })).toBeVisible();
  });

  test('le bouton "Essai gratuit" mène à l\'inscription', async ({ page }) => {
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    const pilotLink = page.locator('a[href="/fr/auth/register?plan=PILOT"]').first();
    await expect(pilotLink).toBeVisible();
    await pilotLink.click();
    await expect(page).toHaveURL(/\/fr\/auth\/register\?plan=PILOT/);
  });

  test('le formulaire d\'inscription a 3 étapes', async ({ page }) => {
    await page.goto('/fr/auth/register?plan=PILOT', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await expect(page.locator('text=Étape 1/3')).toBeVisible();
  });

  test('inscription avec champs vides → erreur', async ({ page }) => {
    await page.goto('/fr/auth/register', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    // Aller à l'étape 1 et cliquer Continuer sans remplir
    await page.click('text=Continuer');
    await expect(page.getByText('Veuillez remplir tous les champs obligatoires', { exact: true })).toBeVisible();
  });
});

test.describe('Login existant', () => {
  test('la page login est accessible', async ({ page }) => {
    await page.goto('/fr/auth/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login avec mauvais identifiants → erreur', async ({ page }) => {
    await page.goto('/fr/auth/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.fill('input[type="email"]', 'fake@fake.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // NextAuth redirige vers /auth/error ou affiche un message
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = url.includes('error') || (await page.locator('text=Identifiants').count()) > 0;
    expect(hasError).toBeTruthy();
  });
});

test.describe('API Health', () => {
  test('GET /api/health retourne 200', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
  });

  test('POST /api/fr/auth/register valide les champs', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { prenom: '', nom: '', email: '', password: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/documents/upload sans auth → 401', async ({ request }) => {
    const res = await request.get('/api/documents/upload?dossierId=test');
    expect(res.status()).toBe(401);
  });
});
