/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const routePath = '../../../app/api/lawyer/workspaces/[id]/emails/route';

const mockGetServerSession = jest.fn<(...args: any[]) => Promise<any>>();

const mockPrisma = {
  workspaceEmail: {
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('POST /api/lawyer/workspaces/[id]/emails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { POST } = await import(routePath as any);

    const request = new NextRequest('http://localhost/api/lawyer/workspaces/ws_1/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailId: 'mail_1', action: 'mark_read' }),
    });

    const response = await POST(request, { params: { id: 'ws_1' } } as any);
    expect(response.status).toBe(401);
  });

  it('applies mark_read action for a lawyer user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'lawyer_1' } });
    (mockPrisma.workspaceEmail.update as any).mockResolvedValue({
      id: 'mail_1',
      isRead: true,
      readAt: new Date().toISOString(),
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
    expect(mockPrisma.workspaceEmail.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mail_1' },
        data: expect.objectContaining({ isRead: true }),
      })
    );
  });

  it('returns 400 for unknown action', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'lawyer_1' } });

    const { POST } = await import(routePath as any);

    const request = new NextRequest('http://localhost/api/lawyer/workspaces/ws_1/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailId: 'mail_1', action: 'invalid_action' }),
    });

    const response = await POST(request, { params: { id: 'ws_1' } } as any);
    expect(response.status).toBe(400);
  });
});
