import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { collectMetric, getPerformanceStats } from '@/lib/monitoring';
import { GET, POST } from '@/app/api/analytics/metrics/route';

vi.mock('@/lib/clerk-auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/monitoring', () => ({
  collectMetric: vi.fn(),
  getPerformanceStats: vi.fn(() => ({
    count: 0,
    mean: 0,
    p50: 0,
    p95: 0,
    p99: 0,
    min: 0,
    max: 0,
  })),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

const mockedAuth = vi.mocked(auth);
const mockedCollectMetric = vi.mocked(collectMetric);
const mockedGetPerformanceStats = vi.mocked(getPerformanceStats);

describe('analytics metrics route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated metric reads', async () => {
    mockedAuth.mockResolvedValue({
      isAuthenticated: false,
      clerkUserId: null,
      orgId: null,
      user: null,
    });

    const response = await GET(new NextRequest('http://localhost/api/analytics/metrics'));

    expect(response.status).toBe(401);
  });

  it('allows only monitoring administrators to read aggregate metrics', async () => {
    mockedAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-user',
      orgId: null,
      user: { id: 'user', email: 'user@example.test', name: 'User', role: 'AVOCAT' },
    });

    const response = await GET(new NextRequest('http://localhost/api/analytics/metrics'));

    expect(response.status).toBe(403);
  });

  it('validates an operation query before retrieving its metrics', async () => {
    mockedAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-admin',
      orgId: null,
      user: { id: 'admin', email: 'admin@example.test', name: 'Admin', role: 'ADMIN' },
    });

    const response = await GET(
      new NextRequest('http://localhost/api/analytics/metrics?operation=untrusted%20identifier')
    );

    expect(response.status).toBe(400);
    expect(mockedGetPerformanceStats).not.toHaveBeenCalled();
  });

  it('accepts only bounded, allowlisted metric submissions from administrators', async () => {
    mockedAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-admin',
      orgId: null,
      user: { id: 'admin', email: 'admin@example.test', name: 'Admin', role: 'SUPER_ADMIN' },
    });

    const response = await POST(
      new NextRequest('http://localhost/api/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify({ operation: 'api.dossiers.list', duration: 123 }),
      })
    );

    expect(response.status).toBe(200);
    expect(mockedCollectMetric).toHaveBeenCalledWith('api.dossiers.list', 123);
  });

  it('rejects arbitrary payload fields so client data is not logged as metric metadata', async () => {
    mockedAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk-admin',
      orgId: null,
      user: { id: 'admin', email: 'admin@example.test', name: 'Admin', role: 'ADMIN' },
    });

    const response = await POST(
      new NextRequest('http://localhost/api/analytics/metrics', {
        method: 'POST',
        body: JSON.stringify({
          operation: 'api.dossiers.list',
          duration: 123,
          metadata: { email: 'client@example.test' },
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(mockedCollectMetric).not.toHaveBeenCalled();
  });
});
