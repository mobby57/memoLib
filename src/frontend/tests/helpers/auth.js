/**
 * Helper functions for authentication in E2E tests
 */

/**
 * Perform login for E2E tests
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} password - Password to use (default: 'test123456')
 */
export async function login(page, password = 'test123456') {
  // Check if backend is running first
  try {
    await page.goto('/api/health', { timeout: 5000 });
  } catch (error) {
    throw new Error('Backend server not running. Please start with: python src/web/app.py');
  }
  
  // Go to login page
  await page.goto('/login');
  
  // Wait for the page to load - use domcontentloaded only
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  
  // Check if we're on the mode selection screen OR first-time screen
  const isChoiceScreen = await page.locator('text=J\'ai déjà un compte').isVisible({ timeout: 3000 }).catch(() => false);
  const isFirstTimeScreen = await page.locator('text=Première utilisation').isVisible({ timeout: 3000 }).catch(() => false);
  
  if (isFirstTimeScreen) {
    // It's the first time - need to setup account
    await setupNewAccount(page, password);
    return;
  }
  
  if (isChoiceScreen) {
    // Click on "J'ai déjà un compte" (existing user)
    await page.click('text=J\'ai déjà un compte');
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  }
  
  // Wait for password input to be visible (might already be visible)
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  
  // Fill password
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to homepage or dashboard
  await page.waitForURL('/', { timeout: 15000 }).catch(async () => {
    // If navigation failed, try alternative routes
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // We're already logged in somewhere else
      return;
    }
    // If still on login, there might be an error
    const errorVisible = await page.locator('.bg-red-50').isVisible().catch(() => false);
    if (errorVisible) {
      // Try to get error text for better debugging
      const errorText = await page.locator('.bg-red-50').textContent().catch(() => 'Unknown error');
      throw new Error(`Login failed: ${errorText}`);
    }
  });
}

/**
 * Setup a new account (first-time login)
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} password - Password to set (default: 'test123456')
 */
export async function setupNewAccount(page, password = 'test123456') {
  // Go to login page
  await page.goto('/login');
  
  // Wait for the page to load with shorter timeout
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
  await page.waitForTimeout(500);
  
  // Click on "Première utilisation" (new user)
  await page.click('text=Première utilisation');
  
  // Wait for password inputs
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });
  
  // Fill password
  const passwordInputs = await page.locator('input[type="password"]').all();
  await passwordInputs[0].fill(password); // First password
  await passwordInputs[1].fill(password); // Confirm password
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Check if user is authenticated
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated(page) {
  try {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
  } catch {
    return false;
  }
}

/**
 * Logout helper
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function logout(page) {
  // Look for logout button in header
  await page.click('[aria-label="Déconnexion"], button:has-text("Déconnexion")').catch(() => {
    // Try menu button first
    return page.click('button[aria-label="Menu"]').then(() => {
      return page.click('text=Déconnexion');
    });
  });
  
  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 });
}