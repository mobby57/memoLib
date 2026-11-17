
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const routePath = '../../../app/api/lawyer/workspaces/[id]/emails/route';

const mocks = vi.hoisted(() => ({
  getServerSessionCompat: vi.fn(),
  getSecurePrisma: vi.fn(),
  email: {
    updateMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: mocks.getServerSessionCompat,
}));

vi.mock('@/lib/prisma', () => ({
  getSecurePrisma: mocks.getSecurePrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('POST /api/lawyer/workspaces/[id]/emails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSessionCompat.mockResolvedValue(null);
    mocks.getSecurePrisma.mockResolvedValue({ email: mocks.email });
  });

  it('returns 401 when user is not authenticated', async () => {
    const { POST } = await import(routePath as any);

    const request = new NextRequest('http://localhost/api/lawyer/workspaces/ws_1/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailId: 'mail_1', action: 'mark_read' }),
    });

    const response = await POST(request, { params: { id: 'ws_1' } } as any);
    expect(response.status).toBe(401);
    expect(mocks.getSecurePrisma).not.toHaveBeenCalled();
  });

  it('returns 403 when the user has no tenant', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({ user: { id: 'lawyer_1' } });

    const { POST } = await import(routePath as any);
    const request = new NextRequest('http://localhost/api/lawyer/workspaces/ws_1/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailId: 'mail_1', action: 'mark_read' }),
    });

    const response = await POST(request, { params: { id: 'ws_1' } } as any);
    expect(response.status).toBe(403);
    expect(mocks.getSecurePrisma).not.toHaveBeenCalled();
  });

  it('applies mark_read action for a lawyer user', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { id: 'lawyer_1', tenantId: 'tenant_1' },
    });
    mocks.email.updateMany.mockResolvedValue({ count: 1 });
    mocks.email.findFirst.mockResolvedValue({
      id: 'mail_1',
      isRead: true,
      readAt: new Date().toISOString(),
      urgency: 'medium',
    });

    const { POST } = await import(routePath as any);

    const request = new NextRequest('http://localhost/api/lawyer/workspaces/ws_1/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailId: 'mail_1', action: 'mark_read' }),
    });

    const response = await POST(request, { params: { id: 'ws_1' } } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mocks.email.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mail_1', tenantId: 'tenant_1', workspaceId: 'ws_1' },
        data: expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
      })
    );
  });

  it('returns 400 for unknown action', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { id: 'lawyer_1', tenantId: 'tenant_1' },
    });

    const { POST } = await import(routePath as any);

    const request = new NextRequest('http://localhost/api/lawyer/workspaces/ws_1/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailId: 'mail_1', action: 'invalid_action' }),
    });

    const response = await POST(request, { params: { id: 'ws_1' } } as any);
    expect(response.status).toBe(400);
    expect(mocks.getSecurePrisma).not.toHaveBeenCalled();
  });

  it('filters emails by tenant and workspace and maps urgency to priority', async () => {
    mocks.getServerSessionCompat.mockResolvedValue({
      user: { id: 'lawyer_1', tenantId: 'tenant_1' },
    });
    mocks.email.findMany.mockResolvedValue([
      { id: 'mail_1', urgency: 'high', receivedDate: new Date() },
    ]);

    const { GET } = await import(routePath as any);
    const request = new NextRequest(
      'http://localhost/api/lawyer/workspaces/ws_1/emails?priority=high&isRead=false'
    );

    const response = await GET(request, { params: { id: 'ws_1' } } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.emails[0].priority).toBe('high');
    expect(mocks.email.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant_1',
          workspaceId: 'ws_1',
          urgency: 'high',
          isRead: false,
        }),
      })
    );
  });
});
