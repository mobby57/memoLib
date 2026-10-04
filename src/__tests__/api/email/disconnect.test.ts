import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockAuth, mockFindUnique, mockDelete } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/security/encryption', () => ({
  EncryptionService: { decrypt: (v: string) => v },
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailAccount: { findUnique: mockFindUnique, delete: mockDelete },
  },
}));

import { POST } from '@/app/api/email/disconnect/route';

function reqWith(body: unknown) {
  return new NextRequest('http://localhost/api/email/disconnect', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/email/disconnect (EMAIL-SEC-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as any;
  });

  it('refuse un utilisateur non authentifié', async () => {
    mockAuth.mockResolvedValue({ isAuthenticated: false, user: null });
    const res = await POST(reqWith({ email: 'a@b.fr' }));
    expect(res.status).toBe(401);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('refuse (404) une boîte qui n’appartient pas au tenant', async () => {
    mockAuth.mockResolvedValue({ isAuthenticated: true, user: { tenantId: 'tenant-A' } });
    mockFindUnique.mockResolvedValue(null); // scope tenantId_email -> rien trouvé
    const res = await POST(reqWith({ email: 'autre@cabinet.fr' }));
    expect(res.status).toBe(404);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('déconnecte: révoque côté provider PUIS supprime en base', async () => {
    mockAuth.mockResolvedValue({ isAuthenticated: true, user: { tenantId: 'tenant-A' } });
    mockFindUnique.mockResolvedValue({
      id: 'acc-1',
      provider: 'gmail',
      accessToken: 'token-clair',
    });
    const res = await POST(reqWith({ email: 'me@cabinet.fr' }));

    expect(res.status).toBe(200);
    // Révocation réelle appelée côté Google
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('oauth2.googleapis.com/revoke'),
      expect.objectContaining({ method: 'POST' })
    );
    // Connexion supprimée en base
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'acc-1' } });
  });

  it('supprime quand même si la révocation provider échoue (best effort)', async () => {
    mockAuth.mockResolvedValue({ isAuthenticated: true, user: { tenantId: 'tenant-A' } });
    mockFindUnique.mockResolvedValue({ id: 'acc-2', provider: 'gmail', accessToken: 'tok' });
    (global.fetch as any).mockRejectedValue(new Error('network'));

    const res = await POST(reqWith({ email: 'me@cabinet.fr' }));

    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'acc-2' } });
  });
});
