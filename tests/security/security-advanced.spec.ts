import { expect, test } from '@playwright/test';

test.describe('Frontières de sécurité publiques', () => {
  test.describe.configure({ mode: 'serial' });

  test('la sonde de vie applique les en-têtes de protection', async ({ request }) => {
    const response = await request.get('/api/health/live');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('les documents ne sont pas accessibles sans session Clerk', async ({ request }) => {
    const response = await request.get('/api/documents?dossierId=untrusted-dossier');

    expect(response.status()).toBe(401);
  });

  test('un upload non authentifié est refusé avant le traitement du fichier', async ({ request }) => {
    const response = await request.post('/api/documents/upload', {
      multipart: {
        dossierId: 'untrusted-dossier',
        type: 'document',
        file: {
          name: 'malware.exe',
          mimeType: 'application/octet-stream',
          buffer: Buffer.from('MZ'),
        },
      },
    });

    expect(response.status()).toBe(401);
  });

  test('un webhook email sans signature est rejeté sans erreur interne', async ({ request }) => {
    const response = await request.post('/api/webhooks/email-inbound', {
      data: {
        from: 'attacker@example.test',
        body: 'Un contenu non signé',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect([400, 401, 403, 413, 429, 503]).toContain(response.status());
  });
});
