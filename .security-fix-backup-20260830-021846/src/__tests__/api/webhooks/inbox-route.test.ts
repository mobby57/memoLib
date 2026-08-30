import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';

const { prisma, transaction } = vi.hoisted(() => {
  const transaction = vi.fn();
  return {
    transaction,
    prisma: {
      dossier: { findFirst: vi.fn() },
      dossierChecklistItem: { findMany: vi.fn() },
      $transaction: transaction,
    },
  };
});

vi.mock('@/lib/prisma', () => ({ prisma }));

import { POST } from '@/app/api/webhooks/inbox/route';

const originalSecret = process.env.INBOX_WEBHOOK_SECRET;

function signedRequest(payload: Record<string, unknown>, eventId = 'event-1'): NextRequest {
  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', process.env.INBOX_WEBHOOK_SECRET!)
    .update(body, 'utf8')
    .digest('hex');
  return new NextRequest('http://localhost/api/webhooks/inbox', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-id': eventId,
      'x-webhook-signature': `sha256=${signature}`,
    },
    body,
  });
}

describe('POST /api/webhooks/inbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INBOX_WEBHOOK_SECRET = 'test-inbox-secret';
  });

  afterEach(() => {
    process.env.INBOX_WEBHOOK_SECRET = originalSecret;
  });

  it('fails closed when the webhook secret is absent', async () => {
    delete process.env.INBOX_WEBHOOK_SECRET;

    const response = await POST(
      new NextRequest('http://localhost/api/webhooks/inbox', { method: 'POST', body: '{}' })
    );

    expect(response.status).toBe(503);
    expect(prisma.dossier.findFirst).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects an invalid signature before any database access', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/webhooks/inbox', {
        method: 'POST',
        headers: { 'x-webhook-id': 'event-1', 'x-webhook-signature': 'sha256=invalid' },
        body: JSON.stringify({ to: 'dossier@inbox.test', from: 'sender@test', subject: 'Pièce' }),
      })
    );

    expect(response.status).toBe(401);
    expect(prisma.dossier.findFirst).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('requires a provider event ID before any mutation', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/webhooks/inbox', {
        method: 'POST',
        headers: { 'x-webhook-signature': 'sha256=invalid' },
        body: '{}',
      })
    );

    expect(response.status).toBe(400);
    expect(prisma.dossier.findFirst).not.toHaveBeenCalled();
  });

  it('persists an authenticated delivery as the idempotency boundary', async () => {
    prisma.dossier.findFirst.mockResolvedValue({ id: 'dossier-1', tenantId: 'tenant-1' });
    prisma.dossierChecklistItem.findMany.mockResolvedValue([]);
    const tx = {
      channelMessage: { create: vi.fn() },
      auditLog: { create: vi.fn() },
      dossierChecklistItem: { update: vi.fn(), findMany: vi.fn() },
      dossier: { update: vi.fn() },
    };
    transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));

    const response = await POST(
      signedRequest({ to: 'dossier@inbox.test', from: 'sender@test', subject: 'Document' })
    );

    expect(response.status).toBe(200);
    expect(tx.channelMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 'tenant-1', externalId: 'event-1' }),
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledOnce();
  });

  it('acknowledges a duplicate delivery without applying a second mutation', async () => {
    prisma.dossier.findFirst.mockResolvedValue({ id: 'dossier-1', tenantId: 'tenant-1' });
    prisma.dossierChecklistItem.findMany.mockResolvedValue([]);
    transaction.mockRejectedValue(Object.assign(new Error('duplicate'), { code: 'P2002' }));

    const response = await POST(
      signedRequest({ to: 'dossier@inbox.test', from: 'sender@test', subject: 'Document' })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, duplicate: true });
  });
});
