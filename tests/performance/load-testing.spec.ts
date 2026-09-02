import { test, expect } from '@playwright/test';

test.describe('Tests Performance Avancés', () => {
  test('la page publique répond dans le budget de navigation de production', async ({ page }) => {
    test.skip(
      process.env.RUN_PERFORMANCE_BENCHMARKS !== 'true',
      'Les budgets de navigation nécessitent un build de production et une infrastructure dédiée.'
    );

    const response = await page.goto('/');
    const navigation = await page.evaluate(() => performance.getEntriesByType('navigation')[0]);

    expect(response?.ok()).toBe(true);
    expect(navigation.duration).toBeLessThan(10_000);
  });

  test('la sonde de vie publique supporte des requêtes simultanées', async ({ request }) => {
    const warmup = await request.get('/api/health/live', { timeout: 30_000 });
    expect(warmup.status()).toBe(200);

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => request.get('/api/health/live', { timeout: 5_000 }))
    );

    expect(responses).toHaveLength(10);
    expect(responses.every((response) => response.status() === 200)).toBe(true);
  });
});