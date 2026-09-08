import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Tests du cron /api/cron/intake-purge : auth CRON_SECRET + exécution.
 */

const mocks = vi.hoisted(() => ({ runIntakePurge: vi.fn() }));
vi.mock('@/lib/cron/intake-purge', () => ({ runIntakePurge: mocks.runIntakePurge }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { GET } from '@/app/api/cron/intake-purge/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.runIntakePurge.mockResolvedValue({ scanned: 0, purgedRequests: 0, purgedFiles: 0, dryRun: false, cutoff: 'x' });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function req(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

describe('GET /api/cron/intake-purge', () => {
  it('401 en prod sans secret valide', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'sekret');
    const res = await GET(req('http://localhost/api/cron/intake-purge'));
    expect(res.status).toBe(401);
    expect(mocks.runIntakePurge).not.toHaveBeenCalled();
  });

  it('autorisé avec Bearer secret', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'sekret');
    const res = await GET(req('http://localhost/api/cron/intake-purge', { authorization: 'Bearer sekret' }));
    expect(res.status).toBe(200);
    expect(mocks.runIntakePurge).toHaveBeenCalled();
  });

  it('passe days et dryRun au job', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = await GET(req('http://localhost/api/cron/intake-purge?days=90&dryRun=1'));
    expect(res.status).toBe(200);
    expect(mocks.runIntakePurge).toHaveBeenCalledWith(
      expect.objectContaining({ retentionDays: 90, dryRun: true })
    );
  });
});
