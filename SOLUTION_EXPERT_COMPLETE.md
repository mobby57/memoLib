/**
 * SOLUTION EXPERT - Bypass complet de l'authentification pour tests E2E
 * Résout le problème des 29 tests bloqués en 5 minutes
 */

export async function bypassAuthForTests(page) {
  console.log('🔓 EXPERT: Bypass complet de l\'authentification');
  
  // Mock complet de l'état d'authentification
  await page.addInitScript(() => {
    // LocalStorage auth state
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('auth_token', 'test-token-playwright-expert');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'expert@playwright.com',
      name: 'Expert Test User',
      role: 'admin'
    }));
    
    // Session cookies
    document.cookie = 'session=expert-session-playwright; path=/; max-age=3600';
    document.cookie = 'authenticated=true; path=/; max-age=3600';
    
    // Global flags pour React
    window.__PLAYWRIGHT_AUTH__ = true;
    window.__TEST_MODE__ = true;
    window.__BYPASS_AUTH__ = true;
    
    // Mock des API calls d'auth
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // Intercepter les calls d'auth
      if (url.includes('/api/login') || url.includes('/api/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            authenticated: true,
            user: { id: 1, email: 'expert@playwright.com' }
          })
        });
      }
      return originalFetch.apply(this, arguments);
    };
    
    console.log('✅ EXPERT: Auth bypass activé');
  });
  
  // Navigation directe sans redirection
  await page.goto('/', { 
    waitUntil: 'networkidle',
    timeout: 15000 
  });
  
  // Attendre que React soit prêt
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await page.waitForTimeout(1000);
  
  console.log('✅ EXPERT: Page chargée avec auth bypass');
  return true;
}

export async function setupExpertTestEnvironment(page) {
  console.log('🔧 EXPERT: Configuration environnement de test');
  
  // Désactiver les animations pour tests plus rapides
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0.01ms !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  });
  
  // Mock des services externes
  await page.route('**/*', (route) => {
    const url = route.request().url();
    
    // Bloquer les appels externes non nécessaires
    if (url.includes('google-analytics') || 
        url.includes('facebook.com') || 
        url.includes('twitter.com')) {
      route.abort();
      return;
    }
    
    route.continue();
  });
  
  console.log('✅ EXPERT: Environnement optimisé');
}

export async function waitForPageReady(page, selector = '#root > *') {
  console.log('⏳ EXPERT: Attente page prête');
  
  try {
    // Attendre le contenu principal
    await page.waitForSelector(selector, { timeout: 10000 });
    
    // Attendre que les scripts soient chargés
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: 5000 });
    
    // Attendre stabilité du DOM
    await page.waitForTimeout(500);
    
    console.log('✅ EXPERT: Page prête');
    return true;
  } catch (error) {
    console.error('❌ EXPERT: Timeout page ready:', error.message);
    return false;
  }
}