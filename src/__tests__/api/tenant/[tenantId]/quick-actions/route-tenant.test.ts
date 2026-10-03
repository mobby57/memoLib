import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock('@/lib/clerk-auth', () => ({ auth: mockAuth }));

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    dossier: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    echeance: { findFirst: vi.fn(), update: vi.fn() },
    facture: { create: vi.fn() },
  },
}));
vi.mock('@/lib/prisma', () => ({ default: prismaMock, prisma: prismaMock }));

import { POST } from '@/app/api/tenant/[tenantId]/quick-actions/route';

const userA = { id: 'u1', tenantId: 'tenant_A', role: 'AVOCAT', email: 'a@t.com', name: 'A' };
const userB = { id: 'u2', tenantId: 'tenant_B', role: 'AVOCAT', email: 'b@t.com', name: 'B' };

const auth = (u: any = userA) =>
  mockAuth.mockResolvedValue(
    u
      ? { isAuthenticated: true, clerkUserId: 'c1', orgId: null, user: u }
      : { isAuthenticated: false, clerkUserId: null, orgId: null, user: null }
  );

const params = (tenantId: string) => ({ params: { tenantId } });
const postReq = (body: any) =>
  new NextRequest('http://x', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

describe('IDOR — quick-actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401 sans session', async () => {
    auth(null);
    const res = await POST(postReq({ action: 'create_dossier', data: {} }), params('tenant_A'));
    expect(res.status).toBe(401);
  });

  it("403 si user d'un autre tenant passe tenant_A dans l'URL", async () => {
    auth(userB);
    const res = await POST(postReq({ action: 'create_dossier', data: {} }), params('tenant_A'));
    expect(res.status).toBe(403);
    expect(prismaMock.dossier.create).not.toHaveBeenCalled();
  });

  it("404 si update_dossier_status cible un dossier d'un autre tenant", async () => {
    auth(userA);
    prismaMock.dossier.findFirst.mockResolvedValue(null);
    const res = await POST(
      postReq({
        action: 'update_dossier_status',
        data: { dossierId: 'dossier_tenant_B', statut: 'CLOS' },
      }),
      params('tenant_A')
    );
    expect(res.status).toBe(404);
    expect(prismaMock.dossier.update).not.toHaveBeenCalled();
  });
});
