/**
 * E2E — Parcours Pilote Complet
 * Landing → Inscription → Login → Dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Parcours Pilote SaaS', () => {
  test('la landing page affiche les 4 plans', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Pilote')).toBeVisible();
    await expect(page.locator('text=Solo')).toBeVisible();
    await expect(page.locator('text=Cabinet')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('la page pricing affiche les bons prix', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('text=Gratuit')).toBeVisible();
    await expect(page.locator('text=49€')).toBeVisible();
    await expect(page.locator('text=349€')).toBeVisible();
    await expect(page.locator('text=599€')).toBeVisible();
  });

  test('le bouton "Essai gratuit" mène à l\'inscription', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Essai pilote gratuit');
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('le formulaire d\'inscription a 3 étapes', async ({ page }) => {
    await page.goto('/auth/register?plan=PILOT');
    await expect(page.locator('text=Étape 1/3')).toBeVisible();
  });

  test('inscription avec champs vides → erreur', async ({ page }) => {
    await page.goto('/auth/register');
    // Aller à l'étape 1 et cliquer Continuer sans remplir
    await page.click('text=Continuer');
    await expect(page.locator('text=obligatoires')).toBeVisible();
  });
});

test.describe('Login existant', () => {
  test('la page login est accessible', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login avec mauvais identifiants → erreur', async ({ page }) => {
    await page.goto('/auth/login');
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

  test('POST /api/auth/register valide les champs', async ({ request }) => {
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
