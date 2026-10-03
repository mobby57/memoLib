import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock('@/lib/clerk-auth', () => ({ auth: mockAuth }));

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    dossier: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock('@/lib/prisma', () => ({ default: prismaMock, prisma: prismaMock }));

import * as route from '@/app/api/dossiers/[id]/route';

const userTenantA = { id: 'u1', email: 'a@t.com', name: 'A', role: 'COLLABORATEUR', tenantId: 'tenant_A' };
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const auth = (user: typeof userTenantA | null) =>
  mockAuth.mockResolvedValue(user
    ? { isAuthenticated: true, clerkUserId: 'c1', orgId: null, user }
    : { isAuthenticated: false, clerkUserId: null, orgId: null, user: null });

describe('IDOR isolation — /api/dossiers/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  for (const method of ['GET', 'PATCH', 'DELETE'] as const) {
    const fn = (route as any)[method];
    if (typeof fn !== 'function') continue;

    it(`${method} 401 sans session`, async () => {
      auth(null);
      const init = method === "PATCH" ? { method: "PATCH", body: JSON.stringify({ statut: "CLOS" }), headers: { "Content-Type": "application/json" } } : undefined;
      const res = await fn(new NextRequest("http://x/api/dossiers/id1", init), params("id1"));
      expect(res.status).toBe(401);
    });

    it(`${method} 404 cross-tenant`, async () => {
      auth(userTenantA);
      prismaMock.dossier.findFirst.mockResolvedValue(null);
      prismaMock.dossier.findUnique.mockResolvedValue(null);
      const init = method === "PATCH" ? { method: "PATCH", body: JSON.stringify({ statut: "CLOS" }), headers: { "Content-Type": "application/json" } } : undefined;
      const res = await fn(new NextRequest("http://x/api/dossiers/id1", init), params("id1"));
      expect(res.status).toBe(404);
      if (method === 'PATCH' || method === 'DELETE') {
        expect(prismaMock.dossier.update).not.toHaveBeenCalled();
        expect(prismaMock.dossier.delete).not.toHaveBeenCalled();
      }
    });
  }
});
