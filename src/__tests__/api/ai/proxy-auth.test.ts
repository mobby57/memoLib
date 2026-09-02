import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, canAccessDossier, fetchMock } = vi.hoisted(() => ({
  session: { current: null as { user?: Record<string, unknown> } | null },
  canAccessDossier: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: vi.fn(() => ({ user: session.current?.user ?? null })),
}));
vi.mock('@/lib/auth/dossier-access', () => ({ canAccessDossier }));
vi.mock('@/lib/middleware/rate-limit', () => ({ withAIRateLimit: (handler: unknown) => handler }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.stubGlobal('fetch', fetchMock);

import { POST as analyze } from '@/app/api/ai/analyze/route';
import { POST as generate } from '@/app/api/ai/generate/route';

const request = (body: Record<string, unknown>) =>
  new NextRequest('http://localhost/api/ai/proxy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe.each([
  ['analyze', analyze],
  ['generate', generate],
] as const)('POST /api/ai/%s', (_name, handler) => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.current = { user: { id: 'user-1', tenantId: 'tenant-1', role: 'COLLABORATEUR' } };
  });

  it('rejects anonymous access', async () => {
    session.current = null;
    expect((await handler(request({}))).status).toBe(401);
  });

  it('does not proxy a dossier the caller cannot access', async () => {
    canAccessDossier.mockResolvedValue({ allowed: false, reason: 'no_access' });

    const response = await handler(request({ dossierId: 'dossier-other-tenant' }));

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('proxies a validated request only after dossier access is granted', async () => {
    canAccessDossier.mockResolvedValue({ allowed: true, reason: 'dossier_member' });
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ draft: 'proposition' }),
    });

    const response = await handler(request({ dossierId: 'dossier-1', prompt: 'Résumé' }));

    expect(response.status).toBe(200);
    expect(canAccessDossier).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', tenantId: 'tenant-1', dossierId: 'dossier-1' })
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects unstructured payloads before contacting the AI service', async () => {
    const response = await handler(request({ prompt: 'Résumé', tenantId: 'tenant-other' }));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redacts prompt PII and derives the downstream tenant from the session', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ draft: 'proposition' }),
    });

    const response = await handler(request({ prompt: 'Contactez jean.dupont@example.com' }));

    expect(response.status).toBe(200);
    const forwardedPayload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(forwardedPayload).toMatchObject({
      tenantId: 'tenant-1',
      prompt: expect.stringContaining('[EMAIL_REDACTED]'),
    });
    expect(forwardedPayload.prompt).not.toContain('jean.dupont@example.com');
  });
});
