import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, registerSSEClient } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  registerSSEClient: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: mockAuth,
}));
vi.mock('@/lib/notifications', () => ({
  registerSSEClient,
  unregisterSSEClient: vi.fn(),
}));

import { GET } from '@/app/api/notifications/stream/route';

describe('notification SSE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-user-a',
      orgId: 'org-a',
      user: {
        id: 'user-a',
        email: 'user@test.com',
        name: 'User A',
        role: 'LAWYER',
        tenantId: 'tenant-a',
      },
    });
  });

  it('rejects anonymous streams', async () => {
    mockAuth.mockResolvedValue({
      isAuthenticated: false,
      clerkUserId: null,
      orgId: null,
      user: null,
    });
    expect((await GET(new Request('http://localhost/api/notifications/stream?userId=user-b') as never)).status).toBe(401);
  });

  it('registers only the session user', async () => {
    const response = await GET(new Request('http://localhost/api/notifications/stream?userId=user-b') as never);
    expect(response.status).toBe(200);
    expect(registerSSEClient).toHaveBeenCalledWith('user-a', expect.anything());
  });
});
