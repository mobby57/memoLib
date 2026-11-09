import { test, expect } from '@playwright/test';

test.describe('Tests Sécurité Avancés', () => {
  test('Injection SQL', async ({ request }) => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'/*",
      "' UNION SELECT * FROM users --"
    ];

    for (const input of maliciousInputs) {
      const response = await request.post('/api/clients', {
        data: { name: input, email: 'test@test.com' }
      });
      
      expect(response.status()).not.toBe(500);
      expect(await response.text()).not.toContain('SQL');
    }
  });

  test('XSS Protection', async ({ page }) => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '"><script>alert("xss")</script>'
    ];

    await page.goto('/clients/new');
    
    for (const payload of xssPayloads) {
      await page.fill('[name="name"]', payload);
      await page.click('[data-testid="save"]');
      
      const alerts = [];
      page.on('dialog', dialog => {
        alerts.push(dialog.message());
        dialog.dismiss();
      });
      
      expect(alerts).toHaveLength(0);
    }
  });

  test('CSRF Protection', async ({ request }) => {
    const response = await request.post('/api/cases', {
      data: { title: 'Test Case' },
      headers: { 'Origin': 'https://malicious-site.com' }
    });
    
    expect(response.status()).toBe(403);
  });

  test('Rate Limiting', async ({ request }) => {
    const requests = Array.from({ length: 100 }, () =>
      request.post('/api/auth/signin', {
        data: { email: 'test@test.com', password: 'wrong' }
      })
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status() === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('Session Security', async ({ page, context }) => {
    await page.goto('/auth/signin');
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    
    expect(sessionCookie?.secure).toBe(true);
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe('Strict');
  });

  test('File Upload Security', async ({ page }) => {
    await page.goto('/cases/1');
    
    const maliciousFiles = [
      { name: 'virus.exe', content: 'MZ\x90\x00' },
      { name: 'script.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'large.txt', content: 'A'.repeat(10 * 1024 * 1024) }
    ];
    
    for (const file of maliciousFiles) {
      const buffer = Buffer.from(file.content);
      await page.setInputFiles('[data-testid="file-upload"]', {
        name: file.name,
        mimeType: 'application/octet-stream',
        buffer
      });
      
      const error = await page.locator('[data-testid="upload-error"]').textContent();
      expect(error).toContain('non autorisé');
    }
  });
});