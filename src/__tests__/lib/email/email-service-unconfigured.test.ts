import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendEmail } from '@/lib/email/email-service';

describe('transport email', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ne rapporte pas de succès sans transporteur configuré', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('SENDGRID_API_KEY', '');
    vi.stubEnv('SMTP_HOST', '');

    const result = await sendEmail({
      to: 'client@example.invalid',
      subject: 'Test fictif',
      html: '<p>Message de test</p>',
    });

    expect(result.success).toBe(false);
    expect(result.messageId).toBeUndefined();
  });
});
