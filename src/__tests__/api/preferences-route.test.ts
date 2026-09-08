import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests de /api/preferences (préférences utilisateur clé/valeur).
 * Chaîne : API → auth (scope userId) → Prisma upsert/findMany.
 */

const mocks = vi.hoisted(() => {
  const userPreference = {
    findMany: vi.fn(),
    upsert: vi.fn(),
  };
  return { userPreference, prisma: { userPreference }, authMock: vi.fn() };
});

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: () => mocks.authMock(),
}));

import { GET, PUT } from '@/app/api/preferences/route';

const user = { id: 'user-1', role: 'AVOCAT', tenantId: 'tenant-123', email: 'a@b.fr' };

function putRequest(body: unknown) {
  return new Request('http://localhost/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/preferences', () => {
  it('renvoie 401 si non authentifié', async () => {
    mocks.authMock.mockResolvedValue({ user: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('agrège les préférences en objet clé→valeur (JSON parsé)', async () => {
    mocks.authMock.mockResolvedValue({ user });
    mocks.userPreference.findMany.mockResolvedValue([
      { key: 'theme', value: '"dark"' },
      { key: 'columns', value: '["name","email"]' },
      { key: 'raw', value: 'not-json' },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.theme).toBe('dark');
    expect(data.columns).toEqual(['name', 'email']);
    // Valeur non-JSON : renvoyée telle quelle.
    expect(data.raw).toBe('not-json');
    // Isolation : la requête est scopée au userId de la session.
    expect(mocks.userPreference.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });
});

describe('PUT /api/preferences', () => {
  it('renvoie 401 si non authentifié', async () => {
    mocks.authMock.mockResolvedValue({ user: null });
    const res = await PUT(putRequest({ key: 'theme', value: 'dark' }));
    expect(res.status).toBe(401);
  });

  it('upsert une préférence scopée au userId de la session', async () => {
    mocks.authMock.mockResolvedValue({ user });
    mocks.userPreference.upsert.mockResolvedValue({ key: 'theme', value: '"dark"' });

    const res = await PUT(putRequest({ key: 'theme', value: 'dark' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ key: 'theme', value: 'dark' });
    expect(mocks.userPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_key: { userId: 'user-1', key: 'theme' } },
      })
    );
  });

  it('rejette une clé manquante', async () => {
    mocks.authMock.mockResolvedValue({ user });
    const res = await PUT(putRequest({ value: 'x' }));
    expect(res.status).toBe(400);
    expect(mocks.userPreference.upsert).not.toHaveBeenCalled();
  });

  it('rejette une clé trop longue', async () => {
    mocks.authMock.mockResolvedValue({ user });
    const res = await PUT(putRequest({ key: 'k'.repeat(101), value: 'x' }));
    expect(res.status).toBe(400);
  });

  it('sérialise une valeur objet en JSON', async () => {
    mocks.authMock.mockResolvedValue({ user });
    mocks.userPreference.upsert.mockResolvedValue({ key: 'filters', value: '{"a":1}' });

    await PUT(putRequest({ key: 'filters', value: { a: 1 } }));

    const call = mocks.userPreference.upsert.mock.calls[0][0];
    expect(call.create.value).toBe('{"a":1}');
    expect(call.update.value).toBe('{"a":1}');
  });
});
