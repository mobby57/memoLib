/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockCreateEventLog = jest.fn();
const mockAnalyzeEmail = jest.fn();
const mockEvaluateAllRules = jest.fn();
const mockApplyActions = jest.fn();
const mockCalculateScore = jest.fn();
const mockSaveScore = jest.fn();

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
    mockPrisma.tenant.findFirst.mockResolvedValue({ id: 'tenant_1' });
    mockPrisma.email.findFirst.mockResolvedValue({ id: 'email_existing_1' });

    const { POST } = await import('@/app/api/emails/incoming/route');

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
    const { POST } = await import('@/app/api/emails/incoming/route');

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
});
