import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/server-session', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

jest.mock('@/lib/auth/rbac', () => ({
  RBAC_PERMISSIONS: {
    DOSSIERS_MANAGE: 'dossiers:manage',
  },
  requireApiPermission: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  getClientIP: jest.fn(() => '127.0.0.1'),
  addRateLimitHeaders: jest.fn((response: Response) => response),
}));

jest.mock('@/lib/blackbox/engine', () => ({
  runBlackbox: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { getServerSession } from '@/lib/auth/server-session';
import { requireApiPermission } from '@/lib/auth/rbac';
import { checkRateLimit } from '@/lib/rate-limit';
import { runBlackbox } from '@/lib/blackbox/engine';
import { POST } from '@/app/api/blackbox/evaluate/route';

describe('/api/blackbox/evaluate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (requireApiPermission as jest.Mock).mockReturnValue({
      ok: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    (checkRateLimit as jest.Mock).mockResolvedValue({
      success: true,
      remaining: 9,
      reset: new Date(Date.now() + 10000),
      limit: 10,
    });

    const request = new NextRequest('http://localhost/api/blackbox/evaluate', {
      method: 'POST',
      body: JSON.stringify({ value: 10 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    (requireApiPermission as jest.Mock).mockReturnValue({ ok: true });
    (checkRateLimit as jest.Mock).mockResolvedValue({
      success: true,
      remaining: 9,
      reset: new Date(Date.now() + 10000),
      limit: 10,
    });

    const request = new NextRequest('http://localhost/api/blackbox/evaluate', {
      method: 'POST',
      body: JSON.stringify({ value: 'bad' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns evaluated result on success', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } });
    (requireApiPermission as jest.Mock).mockReturnValue({ ok: true });
    (checkRateLimit as jest.Mock).mockResolvedValue({
      success: true,
      remaining: 8,
      reset: new Date(Date.now() + 10000),
      limit: 10,
    });
    (runBlackbox as jest.Mock).mockReturnValue({
      score: 81,
      decision: 'approve',
      proof: 'abc',
    });

    const request = new NextRequest('http://localhost/api/blackbox/evaluate', {
      method: 'POST',
      body: JSON.stringify({ value: 25, category: 'vip', riskFactor: 1.1 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.result.score).toBe(81);
    expect(runBlackbox).toHaveBeenCalledWith({ value: 25, category: 'vip', riskFactor: 1.1 });
  });

  it('returns 429 when rate limit is exceeded', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } });
    (requireApiPermission as jest.Mock).mockReturnValue({ ok: true });
    (checkRateLimit as jest.Mock).mockResolvedValue({
      success: false,
      remaining: 0,
      reset: new Date(Date.now() + 10000),
      limit: 10,
    });

    const request = new NextRequest('http://localhost/api/blackbox/evaluate', {
      method: 'POST',
      body: JSON.stringify({ value: 25 }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });
});
