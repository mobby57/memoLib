import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';

/**
 * Tests du webhook d'ingestion intake (Google Sheet).
 * Vérifie : signature HMAC, résolution tenant serveur, création idempotente.
 */

const mocks = vi.hoisted(() => {
  const tenant = { findUnique: vi.fn() };
  return {
    tenant,
    prisma: { tenant },
    createIntakeRequest: vi.fn(),
  };
});

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

vi.mock('@/lib/services/intake.service', () => ({
  createIntakeRequest: mocks.createIntakeRequest,
}));

const SECRET = 'test-intake-secret';
process.env.INTAKE_WEBHOOK_SECRET = SECRET;

import { POST } from '@/app/api/webhooks/intake-sheet/route';

function signedRequest(body: unknown, sig?: string) {
  const raw = JSON.stringify(body);
  const signature = sig ?? `sha256=${createHmac('sha256', SECRET).update(raw, 'utf8').digest('hex')}`;
  return new Request('http://localhost/api/webhooks/intake-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-signature': signature },
    body: raw,
  }) as any;
}

const validBody = {
  tenantSubdomain: 'cabinet-a',
  type: 'OQTF',
  rowId: 'row-42',
  clientEmail: 'client@example.com',
  data: { nom: 'Dupont' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/webhooks/intake-sheet', () => {
  it('rejette une signature invalide (401)', async () => {
    const res = await POST(signedRequest(validBody, 'sha256=deadbeef'));
    expect(res.status).toBe(401);
    expect(mocks.createIntakeRequest).not.toHaveBeenCalled();
  });

  it('rejette un tenant inconnu (404)', async () => {
    mocks.tenant.findUnique.mockResolvedValue(null);
    const res = await POST(signedRequest(validBody));
    expect(res.status).toBe(404);
    expect(mocks.createIntakeRequest).not.toHaveBeenCalled();
  });

  it('rejette un payload invalide (400)', async () => {
    mocks.tenant.findUnique.mockResolvedValue({ id: 't1' });
    const res = await POST(signedRequest({ type: 'OQTF' })); // manque tenantSubdomain/rowId
    expect(res.status).toBe(400);
  });

  it('crée une demande d’intake (201) avec tenant résolu serveur', async () => {
    mocks.tenant.findUnique.mockResolvedValue({ id: 't1' });
    mocks.createIntakeRequest.mockResolvedValue({ id: 'i1', status: 'IN_PROGRESS', completeness: 20 });

    const res = await POST(signedRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toEqual({ id: 'i1', status: 'IN_PROGRESS', completeness: 20 });
    // tenantId vient de la résolution serveur, jamais du payload.
    expect(mocks.createIntakeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 't1',
        origin: 'googlesheet',
        sourceRef: 'row-42',
        type: 'OQTF',
      })
    );
  });
});
