
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const mockCreateEventLog = vi.fn();
const mockAnalyzeEmail = vi.fn();
const mockEvaluateAllRules = vi.fn();
const mockApplyActions = vi.fn();
const mockCalculateScore = vi.fn();
const mockSaveScore = vi.fn();
const incomingRoutePath = '../../../app/api/emails/incoming/route';

const mockPrisma = {
  tenant: { findFirst: vi.fn() },
  client: { findFirst: vi.fn(), create: vi.fn() },
  email: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  emailAttachment: { createMany: vi.fn() },
  workflowExecution: { create: vi.fn(), update: vi.fn() },
  dossier: { findFirst: vi.fn(), create: vi.fn() },
  draft: { findFirst: vi.fn(), create: vi.fn() },
  actionProposal: { upsert: vi.fn() },
};

vi.mock('@/lib/security/webhook-verification', async () => {
  const actual = await vi.importActual<typeof import('@/lib/security/webhook-verification')>('@/lib/security/webhook-verification');
  const { NextResponse: ActualNextResponse } = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    verifyWebhookRequest: vi.fn((req: NextRequest, body: string, secret: string) => {
      const legacySecret = req.headers.get('x-webhook-secret');
      if (legacySecret) {
        if (legacySecret !== secret) {
          return {
            valid: false as const,
            response: ActualNextResponse.json({ error: 'Invalid secret' }, { status: 401 }),
          };
        }
        return { valid: true as const };
      }
      return actual.verifyWebhookRequest(req, body, secret);
    }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
    aIDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
}));

vi.mock('@/lib/services/event-log.service', () => ({
  eventLogService: {
    createEventLog: mockCreateEventLog,
  },
}));

vi.mock('@/lib/workflows/email-intelligence', () => ({
  analyzeEmail: mockAnalyzeEmail,
}));

vi.mock('@/lib/services/filter-rule.service', () => ({
  filterRuleService: {
    evaluateAllRules: mockEvaluateAllRules,
    applyActions: mockApplyActions,
  },
}));

vi.mock('@/lib/services/smart-inbox.service', () => ({
  smartInboxService: {
    calculateScore: mockCalculateScore,
    saveScore: mockSaveScore,
  },
}));

describe('POST /api/emails/incoming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INCOMING_EMAIL_WEBHOOK_SECRET = 'test-secret';
    (mockCreateEventLog as any).mockResolvedValue(undefined);
    (mockEvaluateAllRules as any).mockResolvedValue([]);
    (mockCalculateScore as any).mockResolvedValue({ score: 82, reasons: ['deadline'] });
    (mockSaveScore as any).mockResolvedValue(undefined);
    (mockPrisma.workflowExecution.update as any).mockResolvedValue({ id: 'wf_1' });
    (mockPrisma.email.update as any).mockResolvedValue({ id: 'email_1', isProcessed: true });
    (mockPrisma.emailAttachment.createMany as any).mockResolvedValue({ count: 0 });
    (mockPrisma.draft.findFirst as any).mockResolvedValue(null);
    (mockPrisma.draft.create as any).mockResolvedValue({ id: 'draft_1' });
    (mockPrisma.actionProposal.upsert as any).mockResolvedValue({ id: 'proposal_1' });
  });

  it('returns duplicate=true when email is already known', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
    (mockPrisma.email.findFirst as any).mockResolvedValue({ id: 'email_existing_1' });

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Demande',
        body: 'Bonjour',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      duplicate: true,
      emailId: 'email_existing_1',
      message: 'Email deja traite (idempotent)',
    });

    expect(mockCreateEventLog).toHaveBeenCalledTimes(1);
    expect(mockPrisma.email.create).not.toHaveBeenCalled();
  });

  it('returns 401 when webhook secret is invalid', async () => {
    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'wrong-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Demande',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 when payload is not valid JSON', async () => {
    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: '{bad-json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 503 when incoming webhook secret is not configured', async () => {
    delete process.env.INCOMING_EMAIL_WEBHOOK_SECRET;
    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'any-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Demande',
        body: 'Bonjour',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
  });

  it('returns 400 when payload is invalid', async () => {
    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        subject: 'Payload invalide',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns duplicate=true when create hits P2002 race condition', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
    (mockPrisma.client.findFirst as any).mockResolvedValue(null);
    (mockPrisma.email.findFirst as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'email_race_1' });
    (mockAnalyzeEmail as any).mockResolvedValue({
      category: 'general-inquiry',
      urgency: 'medium',
      sentiment: 'neutral',
    });

    const p2002 = new Error('Unique constraint failed') as Error & { code?: string };
    Object.setPrototypeOf(p2002, Prisma.PrismaClientKnownRequestError.prototype);
    p2002.code = 'P2002';
    (mockPrisma.email.create as any).mockRejectedValue(p2002);

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Demande de RDV',
        body: 'Bonjour',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      duplicate: true,
      emailId: 'email_race_1',
      message: 'Email deja traite (idempotent)',
    });
  });

  it('returns 404 when no tenant matches recipient', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue(null);

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'unknown@memolib.space',
        subject: 'Demande',
        body: 'Bonjour',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
    expect(mockPrisma.email.create).not.toHaveBeenCalled();
  });

  it('keeps duplicate response successful even when duplicate event log fails', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
    (mockPrisma.email.findFirst as any).mockResolvedValue({ id: 'email_existing_2' });
    (mockCreateEventLog as any).mockRejectedValue(new Error('event log duplicate down'));

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Demande de suivi',
        body: 'Je relance mon message precedent.',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      duplicate: true,
      emailId: 'email_existing_2',
    });
    expect(mockPrisma.email.create).not.toHaveBeenCalled();
  });

  it('processes a new email end-to-end with workflow, rules, scoring and attachments', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
    (mockPrisma.client.findFirst as any).mockResolvedValue({ id: 'client_1' });
    (mockPrisma.email.findFirst as any).mockResolvedValue(null);
    (mockAnalyzeEmail as any).mockResolvedValue({
      category: 'appointment-request',
      urgency: 'high',
      sentiment: 'positive',
    });
    (mockPrisma.email.create as any).mockResolvedValue({ id: 'email_1' });
    (mockPrisma.workflowExecution.create as any).mockResolvedValue({ id: 'wf_1' });
    (mockEvaluateAllRules as any).mockResolvedValue([{ rule: { id: 'rule_1', name: 'Urgence client' } }]);

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Demande de RDV urgente',
        body: 'Bonjour, je souhaite un rendez-vous rapidement.',
        messageId: '<msg-new-1@example.com>',
        attachments: [
          {
            filename: 'piece.pdf',
            mimeType: 'application/pdf',
            size: 1200,
          },
        ],
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      emailId: 'email_1',
      workflowId: 'wf_1',
      category: 'appointment-request',
      urgency: 'high',
    });

    expect(mockPrisma.email.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.workflowExecution.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.workflowExecution.update).toHaveBeenCalledTimes(6);
    expect(mockPrisma.email.update).toHaveBeenCalledTimes(1);
    expect(mockEvaluateAllRules).toHaveBeenCalledTimes(1);
    expect(mockApplyActions).toHaveBeenCalledTimes(1);
    expect(mockCalculateScore).toHaveBeenCalledTimes(1);
    expect(mockSaveScore).toHaveBeenCalledTimes(1);
    expect(mockPrisma.emailAttachment.createMany).toHaveBeenCalledTimes(1);

    const eventTypes = mockCreateEventLog.mock.calls.map((call: any[]) => call[0]?.eventType);
    expect(eventTypes).toContain('FLOW_RECEIVED');
    expect(eventTypes).toContain('FLOW_CLASSIFIED');
  });

  it('processes one email with multiple attachments and stores all files metadata', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
    (mockPrisma.client.findFirst as any).mockResolvedValue({ id: 'client_1' });
    (mockPrisma.email.findFirst as any).mockResolvedValue(null);
    (mockAnalyzeEmail as any).mockResolvedValue({
      category: 'document-request',
      urgency: 'medium',
      sentiment: 'neutral',
    });
    (mockPrisma.email.create as any).mockResolvedValue({ id: 'email_multi_attach_1' });
    (mockPrisma.workflowExecution.create as any).mockResolvedValue({ id: 'wf_multi_attach_1' });

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client.docs@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Transmission de documents',
        body: 'Vous trouverez mes documents en pièces jointes.',
        messageId: '<msg-multi-attachments@example.com>',
        attachments: [
          { filename: 'passport.pdf', mimeType: 'application/pdf', size: 21400 },
          { filename: 'justificatif-domicile.pdf', mimeType: 'application/pdf', size: 33210 },
          { filename: 'photo-id.jpg', mimeType: 'image/jpeg', size: 9201 },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockPrisma.emailAttachment.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ emailId: 'email_multi_attach_1', filename: 'passport.pdf' }),
          expect.objectContaining({ emailId: 'email_multi_attach_1', filename: 'justificatif-domicile.pdf' }),
          expect.objectContaining({ emailId: 'email_multi_attach_1', filename: 'photo-id.jpg' }),
        ]),
      })
    );

    const createManyArg = (mockPrisma.emailAttachment.createMany as any).mock.calls[0][0];
    expect(createManyArg.data).toHaveLength(3);
  });

  it('creates a structured proposal, never a client or dossier, for a high-priority sender', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
    (mockPrisma.client.findFirst as any).mockResolvedValue(null);
    (mockPrisma.email.findFirst as any).mockResolvedValue(null);
    (mockAnalyzeEmail as any).mockResolvedValue({
      category: 'new-case',
      urgency: 'high',
      sentiment: 'neutral',
    });
    (mockPrisma.email.create as any).mockResolvedValue({ id: 'email_auto_1' });
    (mockPrisma.workflowExecution.create as any).mockResolvedValue({ id: 'wf_auto_1' });

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'amina.benali@example.com',
        to: 'cabinet@memolib.space',
        subject: 'URGENT - Besoin douvrir un dossier',
        body: 'Je souhaite ouvrir un dossier en urgence.',
        messageId: '<msg-auto-client-dossier@example.com>',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      emailId: 'email_auto_1',
      workflowId: 'wf_auto_1',
    });

    expect(mockPrisma.client.create).not.toHaveBeenCalled();
    expect(mockPrisma.dossier.create).not.toHaveBeenCalled();

    const emailCreateData = (mockPrisma.email.create as any).mock.calls[0][0].data;
    expect(emailCreateData).not.toHaveProperty('clientId');
    expect(emailCreateData).not.toHaveProperty('dossierId');
    expect(mockPrisma.actionProposal.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          tenantId: 'tenant_1',
          emailId: 'email_auto_1',
          type: 'CREATE_DOSSIER',
          idempotencyKey: 'email:email_auto_1:triage:v1',
        }),
      })
    );
  });

  it('returns 500 when attachments persistence fails after email creation', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
    (mockPrisma.client.findFirst as any).mockResolvedValue({ id: 'client_1' });
    (mockPrisma.email.findFirst as any).mockResolvedValue(null);
    (mockAnalyzeEmail as any).mockResolvedValue({
      category: 'document-request',
      urgency: 'medium',
      sentiment: 'neutral',
    });
    (mockPrisma.email.create as any).mockResolvedValue({ id: 'email_fail_attach_1' });
    (mockPrisma.emailAttachment.createMany as any).mockRejectedValue(new Error('storage failed'));

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client.docs@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Documents volumineux',
        body: 'Ci-joint plusieurs documents',
        messageId: '<msg-attach-fail@example.com>',
        attachments: [{ filename: 'big-file.pdf', mimeType: 'application/pdf', size: 991001 }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(mockPrisma.workflowExecution.create).not.toHaveBeenCalled();
  });

  it('keeps ingestion successful when AI/rules/scoring/event logs fail (best effort)', async () => {
    (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
    (mockPrisma.client.findFirst as any).mockResolvedValue(null);
    (mockPrisma.email.findFirst as any).mockResolvedValue(null);
    (mockAnalyzeEmail as any).mockRejectedValue(new Error('AI down'));
    (mockPrisma.email.create as any).mockResolvedValue({ id: 'email_2' });
    (mockPrisma.workflowExecution.create as any).mockResolvedValue({ id: 'wf_2' });
    (mockCreateEventLog as any).mockRejectedValue(new Error('event log down'));
    (mockEvaluateAllRules as any).mockRejectedValue(new Error('rules down'));
    (mockCalculateScore as any).mockRejectedValue(new Error('smart inbox down'));

    const { POST } = await import(incomingRoutePath as any);

    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'cabinet@memolib.space',
        subject: 'Message sans IA',
        body: 'Texte simple',
        messageId: '<msg-best-effort@example.com>',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      emailId: 'email_2',
      workflowId: 'wf_2',
      message: 'Email recu et workflow declenche',
    });

    expect(mockPrisma.email.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.workflowExecution.create).toHaveBeenCalledTimes(1);
  });

  it('simulates a complete demo journey for three client intents', async () => {
    const scenarios = [
      {
        label: 'urgent-oqtf',
        analysis: { category: 'client-urgent', urgency: 'high', sentiment: 'stressed' },
        payload: {
          from: 'fatima.b@testmail.fr',
          to: 'cabinet@memolib.space',
          subject: 'URGENT - OQTF recue hier',
          body: 'Bonjour Maitre, jai recu une OQTF avec delai court, pouvez-vous maider ?',
          messageId: '<demo-oqtf@example.com>',
        },
      },
      {
        label: 'new-case',
        analysis: { category: 'new-case', urgency: 'medium', sentiment: 'neutral' },
        payload: {
          from: 'thomas.r@example.com',
          to: 'cabinet@memolib.space',
          subject: 'Besoin douvrir un nouveau dossier',
          body: 'Je souhaite etre accompagne pour mon recours administratif.',
          messageId: '<demo-new-case@example.com>',
        },
      },
      {
        label: 'appointment-request',
        analysis: { category: 'appointment-request', urgency: 'medium', sentiment: 'positive' },
        payload: {
          from: 'nora.s@example.com',
          to: 'cabinet@memolib.space',
          subject: 'Demande de rendez-vous',
          body: 'Je suis disponible mardi et jeudi pour un rendez-vous.',
          messageId: '<demo-rdv@example.com>',
        },
      },
    ];

    const { POST } = await import(incomingRoutePath as any);

    for (let index = 0; index < scenarios.length; index += 1) {
      const scenario = scenarios[index];

      (mockPrisma.tenant.findFirst as any).mockResolvedValue({ id: 'tenant_1' });
      (mockPrisma.client.findFirst as any).mockResolvedValue({ id: `client_${index + 1}` });
      (mockPrisma.email.findFirst as any).mockResolvedValue(null);
      (mockAnalyzeEmail as any).mockResolvedValue(scenario.analysis);
      (mockPrisma.email.create as any).mockResolvedValue({ id: `email_demo_${index + 1}` });
      (mockPrisma.workflowExecution.create as any).mockResolvedValue({ id: `wf_demo_${index + 1}` });

      const request = new NextRequest('http://localhost/api/emails/incoming', {
        method: 'POST',
        headers: {
          'x-webhook-secret': 'test-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify(scenario.payload),
      });

      const response = await POST(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload).toMatchObject({
        success: true,
        emailId: `email_demo_${index + 1}`,
        workflowId: `wf_demo_${index + 1}`,
        category: scenario.analysis.category,
        urgency: scenario.analysis.urgency,
      });
    }

    expect(mockPrisma.email.create).toHaveBeenCalledTimes(3);
    expect(mockPrisma.workflowExecution.create).toHaveBeenCalledTimes(3);
    expect(mockCalculateScore).toHaveBeenCalledTimes(3);
  });
});
