import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: { user: { tenantId: 'tenant-demo', email: 'cabinet@example.invalid' } },
  tenant: { findUnique: vi.fn() },
  email: { create: vi.fn() },
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: vi.fn(async () => mocks.session),
}));
vi.mock('@/lib/prisma', () => ({
  getSecurePrisma: vi.fn(async () => ({ tenant: mocks.tenant, email: mocks.email })),
}));
vi.mock('@/lib/email/email-service', () => ({ sendEmail: mocks.sendEmail }));

import { POST } from '@/app/api/emails/send/route';

describe('envoi email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tenant.findUnique.mockResolvedValue({ name: 'Cabinet fictif', billingEmail: null });
  });

  it('signale un échec du transport sans enregistrer un email comme envoyé', async () => {
    mocks.sendEmail.mockResolvedValue({ success: false, error: 'Transport indisponible' });
    const request = new NextRequest('http://localhost/api/emails/send', {
      method: 'POST',
      body: JSON.stringify({
        to: 'client@example.invalid',
        subject: 'Test fictif',
        body: 'Message de test',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(502);
    expect(mocks.email.create).not.toHaveBeenCalled();
  });

  it('enregistre le message lorsque le transport confirme son envoi', async () => {
    mocks.sendEmail.mockResolvedValue({ success: true, messageId: 'message-demo' });
    mocks.email.create.mockResolvedValue({ id: 'email-demo' });
    const request = new NextRequest('http://localhost/api/emails/send', {
      method: 'POST',
      body: JSON.stringify({
        to: 'client@example.invalid',
        subject: 'Test fictif',
        body: 'Message de test',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, emailId: 'email-demo' });
    expect(mocks.email.create).toHaveBeenCalledOnce();
  });
});
