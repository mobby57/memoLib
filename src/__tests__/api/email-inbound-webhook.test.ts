import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    email: { findFirst: vi.fn(), create: vi.fn() },
    tenant: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/security/email-encryption', () => ({
  encryptEmailBody: vi.fn(),
}));

import { POST } from '@/app/api/webhooks/email-inbound/route';
import { prisma } from '@/lib/prisma';

describe('POST /api/webhooks/email-inbound authentication', () => {
  beforeEach(() => {
    vi.stubEnv('EMAIL_WEBHOOK_SECRET', '');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fails closed when the webhook secret is not configured', async () => {
    const request = new Request('http://localhost/api/webhooks/email-inbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'target-tenant',
        from: 'sender@example.com',
        body: 'message',
      }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(503);
    expect(prisma.email.create).not.toHaveBeenCalled();
  });

  it('rejects a missing or incorrect secret before parsing the message', async () => {
    vi.stubEnv('EMAIL_WEBHOOK_SECRET', 'configured-test-secret');

    const request = new Request('http://localhost/api/webhooks/email-inbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'target-tenant',
        from: 'sender@example.com',
        body: 'message',
      }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
    expect(prisma.email.create).not.toHaveBeenCalled();
  });
});
