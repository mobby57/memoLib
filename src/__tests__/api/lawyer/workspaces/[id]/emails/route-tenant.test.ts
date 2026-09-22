import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock('@/lib/clerk-auth', () => ({ auth: mockAuth }));
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    workspaceEmail: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    workspace: { findFirst: vi.fn() },
  },
}));
vi.mock('@/lib/prisma', () => ({ default: prismaMock, prisma: prismaMock }));
import * as route from '@/app/api/lawyer/workspaces/[id]/emails/route.ts';

const userA = { id: 'u1', tenantId: 'tenant_A', role: 'AVOCAT', email: 'a@t.com', name: 'A' };
const auth = (u: any = userA) => mockAuth.mockResolvedValue(
  u ? { isAuthenticated: true, clerkUserId: 'c1', orgId: null, user: u }
    : { isAuthenticated: false, clerkUserId: null, orgId: null, user: null }
);
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('IDOR — api/lawyer/workspaces/[id]/emails/route.ts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401 sans session (GET)', async () => {
    auth(null);
    const res = await (route as any).GET(new NextRequest('http://x'), params('t1'));
    expect(res.status).toBe(401);
  });

  it('404 cross-tenant (GET)', async () => {
    auth(userA);
    if ('yes' === 'yes') prismaMock.workspace.findFirst.mockResolvedValue(null);
    prismaMock.workspaceEmail.findMany.mockResolvedValue([]);
    prismaMock.workspaceEmail.findFirst.mockResolvedValue(null);

    const res = await (route as any).GET(new NextRequest('http://x'), params('t_other'));
    if ('yes' === 'yes') expect(res.status).toBe(404);
  });
});
