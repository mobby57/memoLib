import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth } = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({ auth }));

import { POST } from '@/app/api/analytics/abandon/route';

const request = (body: Record<string, unknown>) =>
  new NextRequest('http://localhost/api/analytics/abandon', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/analytics/abandon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests using the Clerk auth context', async () => {
    auth.mockResolvedValue({
      isAuthenticated: false,
      clerkUserId: null,
      orgId: null,
      user: null,
    });

    const response = await POST(request({ workflow: 'onboarding', step: 'profile' }));

    expect(response.status).toBe(401);
  });

  it('accepts an event for an authenticated Clerk user', async () => {
    auth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'user_clerk_123',
      orgId: null,
      user: null,
    });

    const response = await POST(request({ workflow: 'onboarding', step: 'profile' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
