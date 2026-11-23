import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getSecurePrisma: vi.fn(),
  tenantFindFirst: vi.fn(),
  recordEmailIngestion: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  getSecurePrisma: mocks.getSecurePrisma,
}));
vi.mock('@/lib/security/webhook-verification', () => ({
  verifyWebhookRequest: vi.fn(() => ({ valid: true })),
}));
vi.mock('@/lib/email/ingestion-metrics', () => ({
  recordEmailIngestion: mocks.recordEmailIngestion,
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/services/event-log.service', () => ({
  eventLogService: { createEventLog: vi.fn() },
}));
vi.mock('@/lib/services/smart-inbox.service', () => ({
  smartInboxService: { calculateScore: vi.fn(), saveScore: vi.fn() },
}));
vi.mock('@/lib/services/filter-rule.service', () => ({
  filterRuleService: { evaluateAllRules: vi.fn(), applyActions: vi.fn() },
}));
vi.mock('@/lib/workflows/email-intelligence', () => ({
  analyzeEmail: vi.fn(),
}));

import { POST } from '@/app/api/emails/incoming/route';

describe('incoming email attachment guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('INCOMING_EMAIL_WEBHOOK_SECRET', 'test-secret');
    mocks.getSecurePrisma.mockResolvedValue({
      tenant: { findFirst: mocks.tenantFindFirst },
    });
  });

  it('rejects attachments before tenant lookup, AI analysis, or persistence', async () => {
    const request = new NextRequest('http://localhost/api/emails/incoming', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        from: 'client@example.com',
        to: 'cabinet@example.com',
        subject: 'Document',
        attachments: [{ filename: 'identity.pdf', mimeType: 'application/pdf', size: 12 }],
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toContain('pièces jointes suspendue');
    expect(mocks.tenantFindFirst).not.toHaveBeenCalled();
    expect(mocks.recordEmailIngestion).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'attachment_blocked', hasAttachments: true })
    );
  });
});
