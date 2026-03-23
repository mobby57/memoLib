/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

const mockCreateEventLog = jest.fn();
const mockAnalyzeEmail = jest.fn();
const mockEvaluateAllRules = jest.fn();
const mockApplyActions = jest.fn();
const mockCalculateScore = jest.fn();
const mockSaveScore = jest.fn();
const incomingRoutePath = '../../../app/api/emails/incoming/route';

const mockPrisma = {
  tenant: { findFirst: jest.fn() },
  client: { findFirst: jest.fn(), create: jest.fn() },
  email: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  emailAttachment: { createMany: jest.fn() },
  workflowExecution: { create: jest.fn(), update: jest.fn() },
  dossier: { findFirst: jest.fn(), create: jest.fn() },
};

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('@/lib/services/event-log.service', () => ({
  eventLogService: {
    createEventLog: mockCreateEventLog,
  },
}));

jest.mock('@/lib/workflows/email-intelligence', () => ({
  analyzeEmail: mockAnalyzeEmail,
}));

jest.mock('@/frontend/lib/services/filter-rule.service', () => ({
  filterRuleService: {
    evaluateAllRules: mockEvaluateAllRules,
    applyActions: mockApplyActions,
  },
}));

jest.mock('@/lib/services/smart-inbox.service', () => ({
  smartInboxService: {
    calculateScore: mockCalculateScore,
    saveScore: mockSaveScore,
  },
}));

describe('POST /api/emails/incoming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INCOMING_EMAIL_WEBHOOK_SECRET = 'test-secret';
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
});
