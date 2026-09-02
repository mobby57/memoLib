import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const {
  recordEmailIngestion,
  emailAttachmentCreateMany,
  emailCreate,
  emailFindFirst,
  tenantFindFirst,
} = vi.hoisted(() => ({
  recordEmailIngestion: vi.fn(),
  emailAttachmentCreateMany: vi.fn(),
  emailCreate: vi.fn(),
  emailFindFirst: vi.fn(),
  tenantFindFirst: vi.fn(),
}));

vi.mock('@/lib/security/webhook-verification', () => ({
  verifyWebhookRequest: vi.fn(() => ({ valid: true as const })),
}));
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() =>
    Promise.resolve({ success: true, limit: 5, remaining: 4, reset: new Date(Date.now() + 60_000) })
  ),
  getClientIP: vi.fn(() => '127.0.0.1'),
}));
vi.mock('@/lib/email/ingestion-metrics', () => ({ recordEmailIngestion }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findFirst: tenantFindFirst },
    email: { findFirst: emailFindFirst, create: emailCreate, update: vi.fn() },
    emailAttachment: { createMany: emailAttachmentCreateMany },
    workflowExecution: { create: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@/lib/services/event-log.service', () => ({
  eventLogService: { createEventLog: vi.fn() },
}));
vi.mock('@/lib/services/filter-rule.service', () => ({
  filterRuleService: { evaluateAllRules: vi.fn(() => []), applyActions: vi.fn() },
}));
vi.mock('@/lib/services/smart-inbox.service', () => ({
  smartInboxService: { calculateScore: vi.fn(), saveScore: vi.fn() },
}));
vi.mock('@/lib/services/action-proposal.service', () => ({
  createEmailActionProposal: vi.fn(),
}));
vi.mock('@/lib/workflows/email-intelligence', () => ({
  analyzeEmail: vi.fn(() => ({
    category: 'general-inquiry',
    urgency: 'medium',
    sentiment: 'neutral',
  })),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { POST } from '@/app/api/emails/incoming/route';

describe('POST /api/emails/incoming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INCOMING_EMAIL_WEBHOOK_SECRET = 'test-secret';
    tenantFindFirst.mockResolvedValue({ id: 'tenant-1' });
    emailFindFirst.mockResolvedValue(null);
    emailCreate.mockResolvedValue({ id: 'email-1' });
    emailAttachmentCreateMany.mockRejectedValue(new Error('attachment persistence failure'));
  });

  it('records a generic attachment failure and returns 500 without a reference error', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/emails/incoming', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: 'sender@example.test',
          to: 'inbox@example.test',
          subject: 'Pièce jointe',
          body: 'Bonjour',
          attachments: [{ filename: 'document.pdf', mimeType: 'application/pdf', size: 100 }],
        }),
      })
    );

    expect(response.status).toBe(500);
    expect(recordEmailIngestion).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'attachment_error', error: 'attachment_error' })
    );
  });
});
