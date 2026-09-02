import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';

const { processEmail, findFirst, checkRateLimit } = vi.hoisted(() => ({
  processEmail: vi.fn(),
  findFirst: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/email/email-monitor-service', () => ({
  emailMonitor: { processEmail },
}));
vi.mock('@/lib/prisma', () => ({ prisma: { email: { findFirst } } }));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
  getClientIP: vi.fn(() => '127.0.0.1'),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { POST } from '@/app/api/webhooks/email/route';
import { POST as emailInbound } from '@/app/api/webhooks/email-inbound/route';
import { IncomingEmailPayloadSchema } from '@/lib/email/ingestion';

const originalSecret = process.env.EMAIL_WEBHOOK_SECRET;

function signedRequest(body: Record<string, string>, eventId = 'delivery-1'): NextRequest {
  const rawBody = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', process.env.EMAIL_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  return new NextRequest('http://localhost/api/webhooks/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-id': eventId,
      'x-webhook-timestamp': timestamp,
      'x-webhook-signature': signature,
    },
    body: rawBody,
  });
}

describe('POST /api/webhooks/email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EMAIL_WEBHOOK_SECRET = 'test-email-webhook-secret';
    checkRateLimit.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: new Date(Date.now() + 60_000),
    });
    findFirst.mockResolvedValue(null);
    processEmail.mockResolvedValue({ emailId: 'email-1', processingStatus: 'RECEIVED' });
  });

  afterEach(() => {
    process.env.EMAIL_WEBHOOK_SECRET = originalSecret;
  });

  it('rejects unsigned deliveries before parsing or processing them', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/webhooks/email', {
        method: 'POST',
        headers: { 'x-webhook-id': 'delivery-1' },
        body: JSON.stringify({ tenantId: 'tenant-1', rawEmail: 'From: sender@example.test' }),
      })
    );

    expect(response.status).toBe(401);
    expect(findFirst).not.toHaveBeenCalled();
    expect(processEmail).not.toHaveBeenCalled();
  });

  it('uses the immutable delivery ID as the idempotency key', async () => {
    const response = await POST(
      signedRequest({ tenantId: 'tenant-1', rawEmail: 'From: sender@example.test\n\nHello' })
    );

    expect(response.status).toBe(200);
    expect(processEmail).toHaveBeenCalledWith(
      'tenant-1',
      'From: sender@example.test\n\nHello',
      'delivery-1'
    );
  });

  it('acknowledges a previously stored delivery without processing it twice', async () => {
    findFirst.mockResolvedValue({ id: 'email-existing' });

    const response = await POST(
      signedRequest({ tenantId: 'tenant-1', rawEmail: 'From: sender@example.test\n\nHello' })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      duplicate: true,
      emailId: 'email-existing',
    });
    expect(processEmail).not.toHaveBeenCalled();
  });

  it('rejects an email-inbound delivery with no replay-protection timestamp', async () => {
    const rawBody = JSON.stringify({
      from: 'sender@example.test',
      to: 'inbox@example.test',
      subject: 'Document',
      body: 'Bonjour',
    });
    const signature = createHmac('sha256', process.env.EMAIL_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex');

    const response = await emailInbound(
      new NextRequest('http://localhost/api/webhooks/email-inbound', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-webhook-id': 'delivery-2',
          'x-webhook-signature': signature,
        },
        body: rawBody,
      })
    );

    expect(response.status).toBe(401);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('rejects unexpected fields in structured email payloads', () => {
    expect(
      IncomingEmailPayloadSchema.safeParse({
        from: 'sender@example.test',
        to: 'inbox@example.test',
        subject: 'Document',
        unexpected: 'field',
      }).success
    ).toBe(false);
  });
});
