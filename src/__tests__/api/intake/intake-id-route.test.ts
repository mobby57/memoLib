import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests de /api/intake/[id] : GET (dossiers:read), PATCH (dossiers:manage),
 * scope tenant, 404, validation.
 */

const mocks = vi.hoisted(() => ({
  authMock: vi.fn(),
  getIntakeRequest: vi.fn(),
  updateIntakeResponses: vi.fn(),
  markNeedsHelp: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({ auth: () => mocks.authMock() }));
vi.mock('@/lib/services/intake.service', () => ({
  getIntakeRequest: mocks.getIntakeRequest,
  updateIntakeResponses: mocks.updateIntakeResponses,
  markNeedsHelp: mocks.markNeedsHelp,
}));

import { GET, PATCH } from '@/app/api/intake/[id]/route';

const manager = { id: 'u1', role: 'ADMIN', tenantId: 't1', email: 'a@b.fr' };
const client = { id: 'u2', role: 'CLIENT', tenantId: 't1', email: 'c@b.fr' };
const params = { params: Promise.resolve({ id: 'i1' }) };

function patchReq(body: unknown) {
  return new Request('http://localhost/api/intake/i1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/intake/[id]', () => {
  it('401 si non authentifié', async () => {
    mocks.authMock.mockResolvedValue({ user: null });
    const res = await GET({} as any, params);
    expect(res.status).toBe(401);
  });

  it('renvoie la demande scopée au tenant', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.getIntakeRequest.mockResolvedValue({ id: 'i1', type: 'OQTF', data: {} });
    const res = await GET({} as any, params);
    expect(res.status).toBe(200);
    expect(mocks.getIntakeRequest).toHaveBeenCalledWith('t1', 'i1');
  });

  it('404 si introuvable', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.getIntakeRequest.mockResolvedValue(null);
    const res = await GET({} as any, params);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/intake/[id]', () => {
  it('403 pour un CLIENT (pas dossiers:manage)', async () => {
    mocks.authMock.mockResolvedValue({ user: client });
    const res = await PATCH(patchReq({ data: {}, providedDocuments: [] }), params);
    expect(res.status).toBe(403);
    expect(mocks.updateIntakeResponses).not.toHaveBeenCalled();
  });

  it('met à jour les réponses (dossiers:manage)', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.updateIntakeResponses.mockResolvedValue({ id: 'i1', completeness: 80, data: {}, providedDocuments: [] });
    const res = await PATCH(patchReq({ data: { nom: 'X' }, providedDocuments: ['Passeport'] }), params);
    expect(res.status).toBe(200);
    expect(mocks.updateIntakeResponses).toHaveBeenCalledWith('t1', 'i1', { nom: 'X' }, ['Passeport'], 'u1');
  });

  it('marque needsHelp puis met à jour', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.markNeedsHelp.mockResolvedValue({});
    mocks.updateIntakeResponses.mockResolvedValue({ id: 'i1', completeness: 0, data: {}, providedDocuments: [] });
    const res = await PATCH(patchReq({ data: {}, providedDocuments: [], needsHelp: true }), params);
    expect(res.status).toBe(200);
    expect(mocks.markNeedsHelp).toHaveBeenCalledWith('t1', 'i1', 'u1');
  });

  it('404 si la demande n’existe pas', async () => {
    mocks.authMock.mockResolvedValue({ user: manager });
    mocks.updateIntakeResponses.mockRejectedValue(new Error('Intake request not found'));
    const res = await PATCH(patchReq({ data: {}, providedDocuments: [] }), params);
    expect(res.status).toBe(404);
  });
});
