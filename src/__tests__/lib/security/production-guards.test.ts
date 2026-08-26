import { afterEach, describe, expect, it } from 'vitest';
import { enforceProductionSecurity } from '@/lib/security/production-guards';

const originalNodeEnv = process.env.NODE_ENV;
const originalDemoMode = process.env.DEMO_MODE;
const originalEncryptionKey = process.env.ENCRYPTION_MASTER_KEY;
const originalNextAuthSecret = process.env.NEXTAUTH_SECRET;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.DEMO_MODE = originalDemoMode;
  process.env.ENCRYPTION_MASTER_KEY = originalEncryptionKey;
  process.env.NEXTAUTH_SECRET = originalNextAuthSecret;
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
});
