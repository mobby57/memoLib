import { afterEach, describe, expect, it } from 'vitest';
import { enforceProductionSecurity } from '@/lib/security/production-guards';

const originalNodeEnv = process.env.NODE_ENV;
const originalDemoMode = process.env.DEMO_MODE;
const originalEncryptionKey = process.env.ENCRYPTION_MASTER_KEY;
const originalNextAuthSecret = process.env.CLERK_SECRET_KEY;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.DEMO_MODE = originalDemoMode;
  process.env.ENCRYPTION_MASTER_KEY = originalEncryptionKey;
  process.env.CLERK_SECRET_KEY = originalNextAuthSecret;
});

describe('production security guards', () => {
  it('allows demo mode outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.DEMO_MODE = 'true';

    expect(enforceProductionSecurity).not.toThrow();
  });

  it.each(['true', '1'])('rejects DEMO_MODE=%s in production', (demoMode) => {
    process.env.NODE_ENV = 'production';
    process.env.DEMO_MODE = demoMode;

    expect(enforceProductionSecurity).toThrow(
      'FATAL: DEMO_MODE cannot be enabled in production.'
    );
  });

  it('rejects a production encryption key shorter than 32 characters', () => {
    process.env.NODE_ENV = 'production';
    process.env.DEMO_MODE = 'false';
    process.env.ENCRYPTION_MASTER_KEY = 'too-short';
    process.env.CLERK_SECRET_KEY = 'a-valid-clerk-secret-with-at-least-32-characters';

    expect(enforceProductionSecurity).toThrow(
      'FATAL: Cannot start in production without ENCRYPTION_MASTER_KEY.'
    );
  });
});
