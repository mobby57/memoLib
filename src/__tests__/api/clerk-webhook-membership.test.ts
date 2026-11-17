import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  eventPayload: null as unknown,
  userFindUnique: vi.fn(),
  tenantFindUnique: vi.fn(),
  membershipUpsert: vi.fn(),
  membershipDeleteMany: vi.fn(),
  tenantUpdateMany: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('svix', () => ({
  Webhook: class {
    verify() {
      return mocks.eventPayload;
    }
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    tenant: { findUnique: mocks.tenantFindUnique, updateMany: mocks.tenantUpdateMany },
    tenantMembership: {
      upsert: mocks.membershipUpsert,
      deleteMany: mocks.membershipDeleteMany,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: mocks.loggerError },
}));

import { POST } from '@/app/api/webhooks/clerk/route';

describe('Clerk organization membership webhook', () => {
  const previousSecret = process.env.CLERK_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLERK_WEBHOOK_SECRET = 'test-secret';
    mocks.eventPayload = null;
  });

  afterAll(() => {
    if (previousSecret === undefined) {
      delete process.env.CLERK_WEBHOOK_SECRET;
    } else {
      process.env.CLERK_WEBHOOK_SECRET = previousSecret;
    }
  });

  it('stores the active tenant membership and role from a verified Clerk event', async () => {
    mocks.eventPayload = {
      type: 'organizationMembership.created',
      data: {
        role: 'org:member',
        organization: { id: 'org-a', name: 'Cabinet A' },
        public_user_data: { user_id: 'clerk-user-a' },
      },
    };
    mocks.userFindUnique.mockResolvedValue({ id: 'internal-user-a', tenantId: null });
    mocks.tenantFindUnique.mockResolvedValue({
      id: 'tenant-a',
      clerkOrganizationId: 'org-a',
      status: 'active',
    });

    const response = await POST(createWebhookRequest());

    expect(response.status).toBe(200);
    expect(mocks.membershipUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_userId: { tenantId: 'tenant-a', userId: 'internal-user-a' } },
        create: expect.objectContaining({
          tenantId: 'tenant-a',
          userId: 'internal-user-a',
          role: 'AVOCAT',
          clerkRole: 'org:member',
        }),
      })
    );
  });

  it('rejects unsupported Clerk roles without creating a membership', async () => {
    mocks.eventPayload = {
      type: 'organizationMembership.created',
      data: {
        role: 'org:unknown',
        organization: { id: 'org-a', name: 'Cabinet A' },
        public_user_data: { user_id: 'clerk-user-a' },
      },
    };

    const response = await POST(createWebhookRequest());

    expect(response.status).toBe(500);
    expect(mocks.membershipUpsert).not.toHaveBeenCalled();
  });

  it('removes membership access when Clerk sends a deletion event', async () => {
    mocks.eventPayload = {
      type: 'organizationMembership.deleted',
      data: {
        organization: { id: 'org-a' },
        public_user_data: { user_id: 'clerk-user-a' },
      },
    };
    mocks.userFindUnique.mockResolvedValue({ id: 'internal-user-a' });
    mocks.tenantFindUnique.mockResolvedValue({ id: 'tenant-a' });

    const response = await POST(createWebhookRequest());

    expect(response.status).toBe(200);
    expect(mocks.membershipDeleteMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', userId: 'internal-user-a' },
    });
  });
});

function createWebhookRequest(): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/clerk', {
    method: 'POST',
    headers: {
      'svix-id': 'msg_test',
      'svix-timestamp': '1',
      'svix-signature': 'test-signature',
    },
    body: '{}',
  });
}
