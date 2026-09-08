import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests de GET /api/intake/needs-help : autorisation (dossiers:read), scope
 * tenant, renvoi de métadonnées agrégées.
 */

const mocks = vi.hoisted(() => ({
  authMock: vi.fn(),
  listIntakeNeedingHelp: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({ auth: () => mocks.authMock() }));
vi.mock('@/lib/services/intake.service', () => ({
  listIntakeNeedingHelp: mocks.listIntakeNeedingHelp,
}));

import { GET } from '@/app/api/intake/needs-help/route';

const lawyer = { id: 'u1', role: 'COLLABORATEUR', tenantId: 't1', email: 'l@b.fr' };
const client = { id: 'u2', role: 'CLIENT', tenantId: 't1', email: 'c@b.fr' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/intake/needs-help', () => {
  it('401 si non authentifié', async () => {
    mocks.authMock.mockResolvedValue({ user: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('403 pour un rôle sans dossiers:read... en fait CLIENT a dossiers:read', async () => {
    // CLIENT possède dossiers:read dans le RBAC → autorisé.
    mocks.authMock.mockResolvedValue({ user: client });
    mocks.listIntakeNeedingHelp.mockResolvedValue([]);
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('renvoie la liste scopée au tenant de la session', async () => {
    mocks.authMock.mockResolvedValue({ user: lawyer });
    mocks.listIntakeNeedingHelp.mockResolvedValue([
      { id: 'i1', tenantId: 't1', type: 'OQTF', status: 'PENDING', origin: 'googlesheet', completeness: 0, createdAt: 'x', updatedAt: 'y' },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.count).toBe(1);
    expect(data.items[0].type).toBe('OQTF');
    expect(mocks.listIntakeNeedingHelp).toHaveBeenCalledWith('t1');
  });

  it('400 si l’utilisateur n’a pas de tenant', async () => {
    mocks.authMock.mockResolvedValue({ user: { ...lawyer, tenantId: undefined } });
    const res = await GET();
    expect(res.status).toBe(400);
  });
});
