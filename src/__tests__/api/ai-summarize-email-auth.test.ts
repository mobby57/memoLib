import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { POST } from '@/app/api/ai/summarize-email/route';

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: vi.fn(),
}));

vi.mock('@/lib/ai/hybrid-client', () => ({
  hybridAI: {
    generateWithCostControl: vi.fn(),
    setPreferredProvider: vi.fn(),
  },
}));

vi.mock('@/lib/billing/features', () => ({
  checkFeatureAccess: vi.fn(),
}));

vi.mock('@/lib/security/confidential-mode', () => ({
  checkEmailConfidential: vi.fn(),
}));

describe('POST /api/ai/summarize-email', () => {
  beforeEach(() => {
    vi.mocked(getServerSessionCompat).mockReset();
  });

  it('rejects unauthenticated demo requests', async () => {
    vi.mocked(getServerSessionCompat).mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/ai/summarize-email', {
      method: 'POST',
      headers: { referer: 'http://localhost/fr/demo/email-simulator' },
      body: JSON.stringify({ body: 'Message fictif' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
