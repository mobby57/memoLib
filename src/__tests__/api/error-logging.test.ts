import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('@/lib/security/logger', () => ({ logger: { error: mocks.error } }));
vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: vi.fn(async () => ({ user: { id: 'user-id' } })),
}));
vi.mock('@/lib/analytics/emails', () => ({
  EmailAnalytics: { getCurrentMetrics: vi.fn(async () => { throw new Error('données privées'); }) },
}));
vi.mock('@/lib/legal/documents', () => ({
  legalDocs: { generateCookiePolicy: vi.fn(() => { throw new Error('données privées'); }) },
}));

import { GET as analytics } from '@/app/api/analytics/emails/route';
import { GET as cookies } from '@/app/api/legal/cookies/route';

describe('erreurs des routes', () => {
  it.each([
    ['analytics', analytics, 'email_analytics_failed'],
    ['cookies', cookies, 'cookie_policy_generation_failed'],
  ])('%s ne divulgue pas le contenu de l’erreur', async (_name, handler, logEvent) => {
    const response = await handler(new NextRequest('http://localhost/api/test'));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
    expect(mocks.error).toHaveBeenCalledWith(logEvent, { reason: 'Error' });
  });
});
