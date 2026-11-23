import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/demo/route';

describe('POST /api/demo', () => {
  it('does not report an unrecorded demo request as successful', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const request = new Request('http://localhost/api/demo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nom: 'Démo',
        email: 'demo@example.invalid',
        tailleEquipe: '1',
        dateSouhaitee: tomorrow.toISOString().slice(0, 10),
        heureSouhaitee: '10:00',
        besoinPrincipal: 'Présentation',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(503);
    expect(await response.json()).toHaveProperty('error');
  });

  it('rejects invalid request data', async () => {
    const request = new Request('http://localhost/api/demo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'invalid' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
