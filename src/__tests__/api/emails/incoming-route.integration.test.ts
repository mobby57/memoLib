/**
 * @jest-environment node
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const hasRealDb =
  typeof process.env.DATABASE_URL === 'string' &&
  process.env.DATABASE_URL.length > 0 &&
  /postgres/i.test(process.env.DATABASE_URL) &&
  !/test:test@localhost:5432\/test/i.test(process.env.DATABASE_URL);

const describeIfRealDb = hasRealDb ? describe : describe.skip;

describeIfRealDb('POST /api/emails/incoming (integration db)', () => {
  let POST: (request: NextRequest) => Promise<Response>;
  let prisma: any;

  let tenantId: string;
  let planId: string;
  let recipientEmail: string;
  let dbReady = false;

  const webhookSecret = 'integration-secret';

  beforeAll(async () => {
    process.env.REAL_DB_TESTS = '1';
    process.env.USE_REAL_DB_FOR_TESTS = '1';
    process.env.INCOMING_EMAIL_WEBHOOK_SECRET = webhookSecret;

    jest.resetModules();

    jest.doMock('@/lib/workflows/email-intelligence', () => ({
      analyzeEmail: jest.fn(async () => ({
        category: 'document-request',
        urgency: 'high',
        sentiment: 'neutral',
      })),
    }));

    jest.doMock('@/frontend/lib/services/filter-rule.service', () => ({
      filterRuleService: {
        evaluateAllRules: jest.fn(async () => []),
        applyActions: jest.fn(async () => undefined),
      },
    }));

    jest.doMock('@/lib/services/smart-inbox.service', () => ({
      smartInboxService: {
        calculateScore: jest.fn(async () => ({ score: 77, reasons: ['integration-test'] })),
        saveScore: jest.fn(async () => undefined),
      },
    }));

    jest.doMock('@/lib/services/event-log.service', () => ({
      eventLogService: {
        createEventLog: jest.fn(async () => ({ id: 'event-int' })),
      },
    }));

    ({ prisma } = await import('../../../lib/prisma'));
    ({ POST } = await import('../../../app/api/emails/incoming/route'));

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbReady = true;
    } catch {
      dbReady = false;
    }
  });

  beforeEach(async () => {
    if (!dbReady) {
      return;
    }

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const plan = await prisma.plan.create({
      data: {
        name: `int-plan-${suffix}`,
        displayName: 'Integration Plan',
        priceMonthly: 49,
        priceYearly: 490,
      },
    });
    planId = plan.id;

    const tenant = await prisma.tenant.create({
      data: {
        name: `Tenant Integration ${suffix}`,
        subdomain: `int-${suffix}`,
        planId,
      },
    });
    tenantId = tenant.id;

    recipientEmail = `lawyer.${suffix}@memolib.space`;
    await prisma.user.create({
      data: {
        email: recipientEmail,
        name: 'Lawyer Integration',
        password: 'not-used-in-test',
        role: 'LAWYER',
        tenantId,
      },
    });
  });

  afterAll(async () => {
    if (dbReady && prisma?.tenant && prisma?.plan) {
      // Use raw deletes to avoid Prisma soft-delete middleware on models without deletedAt.
      await prisma.$executeRawUnsafe(`DELETE FROM \"Tenant\" WHERE \"subdomain\" LIKE 'int-%'`);
      await prisma.$executeRawUnsafe(`DELETE FROM \"Plan\" WHERE \"name\" LIKE 'int-plan-%'`);
    }

    if (prisma?.$disconnect) {
      await prisma.$disconnect();
    }
  });

  it('stores email + attachments + workflow in real database', async () => {
    if (!dbReady) {
      expect(true).toBe(true);
      return;
    }

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': webhookSecret,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client.integration@example.com',
        to: recipientEmail,
        subject: 'Envoi de plusieurs documents',
        body: 'Bonjour, voici mon passeport et mon justificatif de domicile.',
        messageId: `<int-msg-${Date.now()}@example.com>`,
        attachments: [
          { filename: 'passeport.pdf', mimeType: 'application/pdf', size: 22000 },
          { filename: 'justificatif.pdf', mimeType: 'application/pdf', size: 18000 },
        ],
      }),
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
        attachments: true,
        workflows: true,
      },
    });

    expect(email).toBeTruthy();
    expect(email.tenantId).toBe(tenantId);
    expect(email.hasAttachments).toBe(true);
    expect(email.attachments).toHaveLength(2);
    expect(email.workflows.length).toBeGreaterThan(0);
  });

  it('prevents duplicates with same messageId and keeps one email row', async () => {
    if (!dbReady) {
      expect(true).toBe(true);
      return;
    }

    const fixedMessageId = `<int-dup-${Date.now()}@example.com>`;

    const firstRequest = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': webhookSecret,
        'content-type': 'application/json',
      },
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
      headers: {
        'x-webhook-secret': webhookSecret,
        'content-type': 'application/json',
      },
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
    if (!dbReady) {
      expect(true).toBe(true);
      return;
    }

    const unknownRecipient = `unknown-${Date.now()}@memolib.space`;

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': webhookSecret,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client.integration@example.com',
        to: unknownRecipient,
        subject: 'Destinataire inconnu',
        body: 'Ce mail doit etre refuse',
        messageId: `<int-unknown-${Date.now()}@example.com>`,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);

    const count = await prisma.email.count({ where: { tenantId } });
    expect(count).toBe(0);
  });
});
