import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  session: null as { user: { id: string; email: string; tenantId: string | null } } | null,
  recordConsents: vi.fn(),
  getUserConsents: vi.fn(),
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: async () => state.session,
}));

vi.mock('@/lib/compliance/gdpr', () => ({
  GDPRCompliance: {
    recordConsents: state.recordConsents,
    getUserConsents: state.getUserConsents,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

import { GET, POST } from '@/app/api/compliance/consent/route';

describe('/api/compliance/consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.session = null;
  });

  it('refuse les requetes non authentifiees', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/compliance/consent', {
        method: 'POST',
        body: JSON.stringify({ consents: [{ type: 'analytics', granted: true }] }),
      })
    );

    expect(response.status).toBe(401);
    expect(state.recordConsents).not.toHaveBeenCalled();
  });

  it('valide le payload et enregistre le consentement avec les identifiants internes', async () => {
    state.session = { user: { id: 'user-id', email: 'user@example.invalid', tenantId: 'tenant-id' } };
    const response = await POST(
      new NextRequest('http://localhost/api/compliance/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ consents: [{ type: 'invalid', granted: true }] }),
      })
    );
    expect(response.status).toBe(400);
    expect(state.recordConsents).not.toHaveBeenCalled();

    const validResponse = await POST(
      new NextRequest('http://localhost/api/compliance/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ consents: [{ type: 'analytics', granted: true }] }),
      })
    );

    expect(validResponse.status).toBe(200);
    expect(state.recordConsents).toHaveBeenCalledWith(
      'tenant-id',
      'user-id',
      [expect.objectContaining({ type: 'analytics', granted: true })]
    );
  });

  it('lit les consentements du tenant courant et de l utilisateur interne', async () => {
    state.session = { user: { id: 'user-id', email: 'user@example.invalid', tenantId: 'tenant-id' } };
    state.getUserConsents.mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(state.getUserConsents).toHaveBeenCalledWith('tenant-id', 'user-id');
  });
});
