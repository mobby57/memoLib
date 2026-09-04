import { beforeEach, describe, expect, it, vi } from 'vitest';

const { session, registerSSEClient } = vi.hoisted(() => ({
  session: { current: null as { user?: { id?: string } } | null },
  registerSSEClient: vi.fn(),
}));

vi.mock('@/lib/clerk-auth', () => ({ auth: vi.fn(async () => session.current ?? { user: null }) }));
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }));
vi.mock('@/lib/notifications', () => ({
  registerSSEClient,
  unregisterSSEClient: vi.fn(),
}));

import { GET } from '@/app/api/notifications/stream/route';

describe('notification SSE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.current = { user: { id: 'user-a' } };
  });

  it('rejects anonymous streams', async () => {
    session.current = null;
    expect((await GET(new Request('http://localhost/api/notifications/stream?userId=user-b') as never)).status).toBe(401);
  });

  it('registers only the session user', async () => {
    const response = await GET(new Request('http://localhost/api/notifications/stream?userId=user-b') as never);
    expect(response.status).toBe(200);
    expect(registerSSEClient).toHaveBeenCalledWith('user-a', expect.anything());
  });
});
