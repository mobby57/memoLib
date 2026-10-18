import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  decryptToken,
  encryptToken,
  isEncryptedToken,
} from '@/lib/security/oauth-tokens';

const CLE_A = 'a'.repeat(64);
const CLE_B = 'b'.repeat(64);

describe('oauth-tokens', () => {
  const avant = process.env.ENCRYPTION_MASTER_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_MASTER_KEY = CLE_A;
  });

  afterEach(() => {
    if (avant === undefined) delete process.env.ENCRYPTION_MASTER_KEY;
    else process.env.ENCRYPTION_MASTER_KEY = avant;
  });

  it('chiffre puis dechiffre un jeton', () => {
    const clair = 'ya29.jeton-de-test-1234567890';
    const chiffre = encryptToken(clair);
    expect(chiffre).not.toContain(clair);
    expect(isEncryptedToken(chiffre)).toBe(true);
    expect(decryptToken(chiffre)).toBe(clair);
  });

  it('accepte un ancien jeton en clair', () => {
    expect(decryptToken('ya29.ancien-jeton')).toBe('ya29.ancien-jeton');
  });

  it('ne rechiffre pas un jeton deja chiffre', () => {
    const chiffre = encryptToken('jeton');
    expect(encryptToken(chiffre)).toBe(chiffre);
  });

  it('echoue franchement avec une mauvaise cle', () => {
    const chiffre = encryptToken('jeton-secret');
    process.env.ENCRYPTION_MASTER_KEY = CLE_B;
    expect(() => decryptToken(chiffre)).toThrow();
  });

  it('echoue sans cle de chiffrement', () => {
    delete process.env.ENCRYPTION_MASTER_KEY;
    expect(() => encryptToken('jeton')).toThrow();
  });
});
