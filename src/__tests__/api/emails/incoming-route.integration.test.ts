
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';

const hasRealDb =
  typeof process.env.DATABASE_URL === 'string' &&
  process.env.DATABASE_URL.length > 0 &&
  /postgres/i.test(process.env.DATABASE_URL) &&
  !/test:test@localhost:5432\/test/i.test(process.env.DATABASE_URL);

if (!hasRealDb) {
  throw new Error(
    'A PostgreSQL DATABASE_URL is required to run the email database integration test.',
  );
}

describe('POST /api/emails/incoming (integration db)', () => {
  let POST: (request: NextRequest) => Promise<Response>;
  let prisma: any;

  let tenantId: string;
  let planId: string;
  let recipientEmail: string;
  const webhookSecret = 'integration-secret';

  function webhookHeaders(body: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return {
      'x-webhook-signature': signature,
      'x-webhook-timestamp': timestamp,
      'content-type': 'application/json',
    };
  }


  beforeAll(async () => {
    process.env.REAL_DB_TESTS = '1';
    process.env.USE_REAL_DB_FOR_TESTS = '1';
    process.env.INCOMING_EMAIL_WEBHOOK_SECRET = webhookSecret;

    vi.resetModules();

    vi.doMock('@/lib/workflows/email-intelligence', () => ({
      analyzeEmail: vi.fn(async () => ({
        category: 'document-request',
        urgency: 'high',
        sentiment: 'neutral',
      })),
    }));

    vi.doMock('@/frontend/lib/services/filter-rule.service', () => ({
      filterRuleService: {
        evaluateAllRules: vi.fn(async () => []),
        applyActions: vi.fn(async () => undefined),
      },
    }));

    vi.doMock('@/lib/services/smart-inbox.service', () => ({
      smartInboxService: {
        calculateScore: vi.fn(async () => ({ score: 77, reasons: ['integration-test'] })),
        saveScore: vi.fn(async () => undefined),
      },
    }));

    vi.doMock('@/lib/services/event-log.service', () => ({
      eventLogService: {
        createEventLog: vi.fn(async () => ({ id: 'event-int' })),
      },
    }));

    ({ prisma } = await import('../../../lib/prisma'));
    ({ POST } = await import('../../../app/api/emails/incoming/route'));

    await prisma.$queryRaw`SELECT 1`;
  });

  beforeEach(async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const plan = await prisma.plan.create({
      data: {
        id: `int-plan-id-${suffix}`,
        name: `int-plan-${suffix}`,
        displayName: 'Integration Plan',
        priceMonthly: 49,
        priceYearly: 490,
        updatedAt: new Date(),
      },
    });
    planId = plan.id;

    const tenant = await prisma.tenant.create({
      data: {
        id: `int-tenant-id-${suffix}`,
        name: `Tenant Integration ${suffix}`,
        subdomain: `int-${suffix}`,
        planId,
        updatedAt: new Date(),
      },
    });
    tenantId = tenant.id;

    recipientEmail = `lawyer.${suffix}@memolib.space`;
    await prisma.user.create({
      data: {
        id: `int-user-id-${suffix}`,
        email: recipientEmail,
        name: 'Lawyer Integration',
        password: 'TEST_PASSWORD',
        role: 'LAWYER',
        tenantId,
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    if (prisma?.tenant && prisma?.plan) {
      await prisma.tenant.deleteMany({
        where: {
          subdomain: { startsWith: 'int-' },
        },
      });

      await prisma.plan.deleteMany({
        where: {
          name: { startsWith: 'int-plan-' },
        },
      });
    }

    if (prisma?.$disconnect) {
      await prisma.$disconnect();
    }
  });

  it('stores email + attachments + workflow in real database', async () => {
    const body = JSON.stringify({
      from: 'client.integration@example.com',
      to: recipientEmail,
      subject: 'Envoi de plusieurs documents',
      body: 'Bonjour, voici mon passeport et mon justificatif de domicile.',
      messageId: `<int-msg-${Date.now()}@example.com>`,
      attachments: [
        { filename: 'passeport.pdf', mimeType: 'application/pdf', size: 22000 },
        { filename: 'justificatif.pdf', mimeType: 'application/pdf', size: 18000 },
      ],
    });

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: webhookHeaders(body),
      body,
    });

    const response = await POST(request);
    const payload: any = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(typeof payload.emailId).toBe('string');
    expect(typeof payload.workflowId).toBe('string');

    const email = await prisma.email.findUnique({
      where: { id: payload.emailId },
      include: {
        EmailAttachment: true,
        WorkflowExecution: true,
      },
    });

    expect(email).toBeTruthy();
    expect(email.tenantId).toBe(tenantId);
    expect(email.hasAttachments).toBe(true);
    expect(email.EmailAttachment).toHaveLength(2);
    expect(email.WorkflowExecution.length).toBeGreaterThan(0);
  });

  it('prevents duplicates with same messageId and keeps one email row', async () => {
    const fixedMessageId = `<int-dup-${Date.now()}@example.com>`;

    const firstRequest = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: webhookHeaders(JSON.stringify({
        from: 'client.integration@example.com',
        to: recipientEmail,
        subject: 'Doublon test',
        body: 'Premier envoi',
        messageId: fixedMessageId,
      })),
      body: JSON.stringify({
        from: 'client.integration@example.com',
        to: recipientEmail,
        subject: 'Doublon test',
        body: 'Premier envoi',
        messageId: fixedMessageId,
      }),
    });

    const secondRequest = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: webhookHeaders(JSON.stringify({
        from: 'client.integration@example.com',
        to: recipientEmail,
        subject: 'Doublon test',
        body: 'Deuxieme envoi identique',
        messageId: fixedMessageId,
      })),
      body: JSON.stringify({
        from: 'client.integration@example.com',
        to: recipientEmail,
        subject: 'Doublon test',
        body: 'Deuxieme envoi identique',
        messageId: fixedMessageId,
      }),
    });

    const firstResponse = await POST(firstRequest);
    const firstPayload: any = await firstResponse.json();

    const secondResponse = await POST(secondRequest);
    const secondPayload: any = await secondResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondPayload.duplicate).toBe(true);
    expect(secondPayload.emailId).toBe(firstPayload.emailId);

    const count = await prisma.email.count({
      where: {
        tenantId,
        messageId: fixedMessageId,
      },
    });

    expect(count).toBe(1);
  });

  it('returns 404 for unknown recipient and does not create email', async () => {
    const unknownRecipient = `unknown-${Date.now()}@memolib.space`;
    const unknownMessageId = `<int-unknown-${Date.now()}@example.com>`;

    const body = JSON.stringify({
      from: 'client.integration@example.com',
      to: unknownRecipient,
      subject: 'Destinataire inconnu',
      body: 'Ce mail doit etre refuse',
      messageId: unknownMessageId,
    });

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: webhookHeaders(body),
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(404);

    const count = await prisma.email.count({ where: { tenantId } });
    expect(count).toBe(0);
  });
});
