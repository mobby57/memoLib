import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decryptEmailBody, encryptEmailBody } from '@/lib/security/email-encryption';

const originalNodeEnv = process.env.NODE_ENV;
const originalKey = process.env.ENCRYPTION_MASTER_KEY;

describe('email encryption production behavior', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_MASTER_KEY = 'test-master-key-for-email-encryption-32chars!';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ENCRYPTION_MASTER_KEY = originalKey;
  });

  it('stores only encrypted email content when a valid key is configured', () => {
    const encrypted = encryptEmailBody('Contenu confidentiel', '<p>Confidentiel</p>');

    expect(encrypted.body).toBe('[ENCRYPTED]');
    expect(encrypted.body).not.toContain('Contenu confidentiel');
    expect(encrypted.bodyEncrypted).toBeTruthy();
    expect(decryptEmailBody(encrypted)).toEqual({
      body: 'Contenu confidentiel',
      htmlBody: '<p>Confidentiel</p>',
    });
  });

  it('refuses a cleartext fallback when encryption fails in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENCRYPTION_MASTER_KEY = 'short';

    expect(() => encryptEmailBody('Contenu confidentiel')).toThrow(
      'refusing cleartext storage in production'
    );
  });
});
