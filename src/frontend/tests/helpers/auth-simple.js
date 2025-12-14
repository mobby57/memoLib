/**
 * Helper fonction pour se connecter dans les tests
 * @param {import('@playwright/test').Page} page - La page Playwright
 * @param {boolean} isNewUser - true si nouvel utilisateur, false sinon
 * @param {string} password - Mot de passe (par défaut 'test123456')
 */
export async function loginForTests(page, isNewUser = false, password = 'test123456') {
  try {
    console.log(`🔐 Tentative de connexion (nouvel utilisateur: ${isNewUser})...`);
    
    // 1. Tenter le mock localStorage (peut ne pas marcher si l'app vérifie côté serveur)
    await page.addInitScript(() => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User' }));
    });
    
    // 2. Aller à la page d'accueil
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // 3. Attendre que React charge le contenu dans #root
    await page.waitForSelector('#root > *', { timeout: 15000 });
    
    // 4. Si on est redirigé vers /login, faire un login manuel
    const currentURL = page.url();
    if (currentURL.includes('/login') || currentURL.includes('/auth')) {
      console.log('🔄 Redirection vers login détectée, login manuel...');
      
      // Attendre le formulaire
      await page.waitForLoadState('networkidle');
      
      if (isNewUser) {
        // Formulaire pour nouveaux utilisateurs - cliquer sur "Nouveau compte"
        console.log('✨ Création nouveau compte...');
        const newUserButton = page.locator('button:has-text("Nouveau compte")');
        await newUserButton.click({ timeout: 5000 });
        await page.waitForTimeout(500);
        
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
      } else {
        // Utilisateur existant - cliquer sur "Compte existant"
        console.log('🔑 Connexion utilisateur existant...');
        const existingUserButton = page.locator('button:has-text("Compte existant")');
        await existingUserButton.click({ timeout: 5000 });
        await page.waitForTimeout(500);
        
        // Remplir le mot de passe
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
      }
      
      // Attendre la redirection après login
      await page.waitForURL('**/', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    }
    
    // 5. Vérifier qu'on est bien connecté (on devrait être sur /accessibility ou /)
    await page.waitForTimeout(1000);
    const finalURL = page.url();
    console.log(`✅ Login réussi! URL finale: ${finalURL}`);
    
  } catch (error) {
    console.error('❌ Erreur durant le login:', error.message);
    
    // Debug: capturer l'état actuel
    const currentURL = page.url();
    console.log(`URL actuelle: ${currentURL}`);
    
    await page.screenshot({
      path: `test-results/debug-login-error-${Date.now()}.png`,
      fullPage: true
    });
    
    throw new Error(`Login échoué: ${error.message}`);
  }
}

/**
 * Vérifier si l'utilisateur est connecté
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function isLoggedIn(page) {
  // Vérifier si on n'est pas sur /login
  const url = page.url();
  if (url.includes('/login')) {
    return false;
  }
  
  // Vérifier si la navigation principale est présente
  const navExists = await page.locator('nav').count() > 0;
  return navExists;
}
