import { test, expect } from '@playwright/test';

test.describe('Tests Performance Avancés', () => {
  test('Core Web Vitals', async ({ page }) => {
    await page.goto('/dashboard');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          resolve(list.getEntries()[0]?.startTime || 0);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        setTimeout(() => resolve(0), 3000);
      });
    });
    
    expect(lcp).toBeLessThan(2500);
  });

  test('Charge simultanée', async ({ browser }) => {
    const pages = await Promise.all(
      Array.from({ length: 10 }, async () => {
        const context = await browser.newContext();
        return context.newPage();
      })
    );

    await Promise.all(
      pages.map(async (page, i) => {
        await page.goto('/auth/signin');
        await page.fill('[name="email"]', `user${i}@test.com`);
        await page.fill('[name="password"]', 'Test123!');
        await page.click('button[type="submit"]');
      })
    );
    
    expect(pages.length).toBe(10);
  });

  test('API stress test', async ({ request }) => {
    const requests = Array.from({ length: 20 }, () =>
      request.get('/api/cases')
    );
    
    const responses = await Promise.all(requests);
    expect(responses.every(r => r.ok())).toBe(true);
  });
});