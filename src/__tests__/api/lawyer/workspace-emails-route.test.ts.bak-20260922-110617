import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const routePath = '../../../app/api/lawyer/workspaces/[id]/emails/route';

const { mockAuth, mockPrisma } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockPrisma: {
    workspaceEmail: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('POST /api/lawyer/workspaces/[id]/emails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({
      isAuthenticated: false,
      clerkUserId: null,
      orgId: null,
      user: null,
    });

    const { POST } = await import(routePath as any);

    const request = new NextRequest(
      'http://localhost/api/lawyer/workspaces/ws_1/emails',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          emailId: 'mail_1',
          action: 'mark_read',
        }),
      }
    );

    const response = await POST(
      request,
      { params: { id: 'ws_1' } } as any
    );

    expect(response.status).toBe(401);
  });

  it('applies mark_read action for a lawyer user', async () => {
    mockAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-lawyer-1',
      orgId: 'org-1',
      user: {
        id: 'lawyer_1',
        email: 'lawyer@test.com',
        name: 'Lawyer',
        role: 'LAWYER',
        tenantId: 'tenant-1',
      },
    });

    mockPrisma.workspaceEmail.update.mockResolvedValue({
      id: 'mail_1',
      isRead: true,
      readAt: new Date().toISOString(),
    });

    const { POST } = await import(routePath as any);

    const request = new NextRequest(
      'http://localhost/api/lawyer/workspaces/ws_1/emails',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          emailId: 'mail_1',
          action: 'mark_read',
        }),
      }
    );

    const response = await POST(
      request,
      { params: { id: 'ws_1' } } as any
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);

    expect(mockPrisma.workspaceEmail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mail_1' },
        data: expect.objectContaining({
          isRead: true,
          readAt: expect.any(Date),
        }),
      })
    );
  });

  it('returns 400 for unknown action', async () => {
    mockAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-lawyer-1',
      orgId: 'org-1',
      user: {
        id: 'lawyer_1',
        email: 'lawyer@test.com',
        name: 'Lawyer',
        role: 'LAWYER',
        tenantId: 'tenant-1',
      },
    });

    const { POST } = await import(routePath as any);

    const request = new NextRequest(
      'http://localhost/api/lawyer/workspaces/ws_1/emails',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          emailId: 'mail_1',
          action: 'invalid_action',
        }),
      }
    );

    const response = await POST(
      request,
      { params: { id: 'ws_1' } } as any
    );

    expect(response.status).toBe(400);
  });
});
