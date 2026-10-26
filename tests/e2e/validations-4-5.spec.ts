import { test, expect } from '@playwright/test';

test.describe('Validation E2E : Tests 4 et 5', () => {

  test('TEST 4 : Le Comptable voit la facture', async ({ page }) => {
    await page.goto('http://localhost:3000/fr/auth/login');
    await page.fill('input[type="email"]', 'comptable@test.fr');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 1. On attend que la page quitte le formulaire de login (peu importe où elle va)
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });

    // 2. On force la navigation vers la page des factures
    await page.goto('http://localhost:3000/fr/admin/factures');
    
    // 3. On vérifie que la facture est là
    await expect(page.locator('text=FAC-2026-001').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ TEST 4 RÉUSSI : Le comptable voit la facture.');
  });

  test('TEST 5 : Le Super Admin voit les 2 cabinets', async ({ page }) => {
    await page.goto('http://localhost:3000/fr/auth/login');
    await page.fill('input[type="email"]', 'morosidibepro@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 1. On attend que la page quitte le formulaire de login
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });

    // 2. On force la navigation vers le super-admin (pour bypasser la redirection vers /admin)
    await page.goto('http://localhost:3000/fr/super-admin/tenants');
    
    // 3. On vérifie que les 2 cabinets sont là
    await expect(page.locator('text=Cabinet Test').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Cabinet Beta').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ TEST 5 RÉUSSI : Le Super Admin voit les 2 cabinets.');
  });
});
