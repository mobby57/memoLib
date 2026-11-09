import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth', 'user.json');

/**
 * Setup authentication pour les tests E2E
 * Crée une session authentifiée réutilisable
 */
setup('authenticate', async ({ page }) => {
  // Aller sur la page de login
  await page.goto('/api/auth/signin');

  // Remplir le formulaire de connexion
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@avocat.com');
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Admin123!');

  // Soumettre
  await page.click('button[type="submit"]');

  // Attendre la redirection
  await page.waitForURL('/lawyer/dashboard');

  // Vérifier que l'utilisateur est connecté
  await expect(page.locator('text=Dashboard')).toBeVisible();

  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: authFile });
});
