import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));

import { POST } from '@/app/api/ai/extract/route';

describe('/api/ai/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    mocks.auth.mockResolvedValue({ userId: 'clerk-user-id' });
  });

  it('requires authentication', async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails closed without sending documents to an external AI provider', async () => {
    const response = await POST();

    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});
