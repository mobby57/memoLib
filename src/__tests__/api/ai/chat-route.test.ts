import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, checkAICostLimit, recordAIUsage } = vi.hoisted(() => ({
  session: { current: null as { user?: Record<string, unknown> } | null },
  checkAICostLimit: vi.fn(),
  recordAIUsage: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: vi.fn(() => ({ user: session.current?.user ?? null })),
}));
vi.mock('@/lib/middleware/rate-limit', () => ({ withAIRateLimit: (handler: unknown) => handler }));
vi.mock('@/lib/monitoring', () => ({
  traceAsync: vi.fn(async (_name: string, operation: () => unknown) => operation()),
  collectMetric: vi.fn(),
}));
vi.mock('@/lib/billing/cost-guard', () => ({ checkAICostLimit, recordAIUsage }));

import { POST } from '@/app/api/ai/chat/route';

const request = (body: Record<string, unknown>) => new NextRequest('http://localhost/api/ai/chat', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});

describe('POST /api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.current = { user: { id: 'user-1', tenantId: 'tenant-1' } };
    checkAICostLimit.mockResolvedValue({ allowed: true });
  });

  it('rejects anonymous requests', async () => {
    session.current = null;
    expect((await POST(request({ message: 'Bonjour' }))).status).toBe(401);
  });

  it('rejects a caller-supplied tenant identifier', async () => {
    const response = await POST(request({ message: 'Bonjour', tenantId: 'tenant-other' }));

    expect(response.status).toBe(400);
    expect(checkAICostLimit).not.toHaveBeenCalled();
  });

  it('uses the authenticated tenant for cost control and usage records', async () => {
    const response = await POST(request({ message: 'Voir mes dossiers' }));

    expect(response.status).toBe(200);
    expect(checkAICostLimit).toHaveBeenCalledWith('tenant-1');
    expect(recordAIUsage).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }));
  });
});
