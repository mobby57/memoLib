/**
 * Helper fonction pour se connecter dans les tests
 * @param {import('@playwright/test').Page} page - La page Playwright
 * @param {boolean} isNewUser - true si nouvel utilisateur, false sinon
 * @param {string} password - Mot de passe (par défaut 'test123456')
 */
export async function loginForTests(page, isNewUser = false, password = 'test123456') {
  try {
    console.log(`🔐 Tentative de connexion (nouvel utilisateur: ${isNewUser})...`);
    
    // 1. Appeler directement l'API de login pour obtenir un vrai token
    const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
      data: {
        password: password,
        isNewUser: isNewUser
      }
    });
    
    if (!loginResponse.ok()) {
      throw new Error(`API login failed: ${loginResponse.status()}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ API login réussi, token obtenu');
    
    // 2. Injecter le token et l'état auth dans les deux formats (localStorage + Zustand)
    await page.addInitScript((token) => {
      // Format classique localStorage
      // Set Zustand auth store state
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          isAuthenticated: true,
          hasCredentials: true,
          needsPassword: false
        },
        version: 0
      }));
      
      // Legacy localStorage for compatibility
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User' }));
      
      // Format Zustand persist (la clé utilisée par le store)
      const zustandAuthState = {
        state: {
          isAuthenticated: true,
          hasCredentials: true,
          needsPassword: false
        },
        version: 0
      };
      localStorage.setItem('auth-storage', JSON.stringify(zustandAuthState));
    }, loginData.token);
    
    // 3. Aller à la page d'accueil avec le token déjà en place
    console.log('🔄 Navigation vers la page d\'accueil...');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // 4. Attendre que React charge
    await page.waitForSelector('#root > *', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // 5. Vérifier qu'on n'est PAS redirigé vers login
    await page.waitForTimeout(1000);
    const finalURL = page.url();
    
    if (finalURL.includes('/login')) {
      throw new Error('Still on login page after authentication');
    }
    
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
