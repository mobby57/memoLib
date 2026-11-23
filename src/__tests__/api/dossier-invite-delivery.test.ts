import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  session: vi.fn(),
  rateLimit: vi.fn(),
  tenant: vi.fn(),
  batch: vi.fn(),
  send: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/auth/getServerSessionCompat', () => ({ getServerSessionCompat: mocks.session }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mocks.rateLimit }));
vi.mock('@/lib/prisma', () => ({ withTenantContext: mocks.tenant, withTenantContextBatch: mocks.batch }));
vi.mock('@/lib/invitations', () => ({
  generateInvitationToken: () => ({ plainToken: 'test-token', tokenHash: 'test-hash' }),
}));
vi.mock('node:crypto', () => ({ randomUUID: () => 'invitation-id' }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));

import { POST } from '@/app/api/dossiers/[id]/invite/route';

function request() {
  return new Request('http://localhost:3010/api/dossiers/dossier-id/invite', {
    method: 'POST',
    body: JSON.stringify({ email: 'client@example.invalid' }),
  });
}

describe('envoi de l’invitation client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: 'clerk-lawyer' });
    mocks.session.mockResolvedValue({ user: { id: 'lawyer', tenantId: 'tenant', role: 'AVOCAT' } });
    mocks.rateLimit.mockResolvedValue({ success: true });
    mocks.tenant.mockResolvedValue({ id: 'dossier-id' });
    mocks.batch.mockResolvedValue([[], [{ id: 'invitation-id' }]]);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3010');
    vi.stubEnv('RESEND_API_KEY', 'test-key');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('refuse la création si l’URL publique est absente', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    const response = await POST(request(), { params: Promise.resolve({ id: 'dossier-id' }) });
    expect(response.status).toBe(500);
    expect(mocks.batch).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('ne présente pas un refus du transporteur comme un envoi', async () => {
    mocks.send.mockResolvedValue({ data: null, error: { name: 'validation_error' } });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await POST(request(), { params: Promise.resolve({ id: 'dossier-id' }) });
      expect(await response.json()).toMatchObject({
        inviteLink: 'http://localhost:3010/fr/invitation/test-token',
        emailStatus: 'failed',
      });
    } finally {
      log.mockRestore();
    }
  });

  it('signale un envoi uniquement lorsque le transporteur retourne un identifiant', async () => {
    mocks.send.mockResolvedValue({ data: { id: 'message-id' }, error: null });
    const response = await POST(request(), { params: Promise.resolve({ id: 'dossier-id' }) });
    expect(await response.json()).toMatchObject({ emailStatus: 'sent' });
  });
});
