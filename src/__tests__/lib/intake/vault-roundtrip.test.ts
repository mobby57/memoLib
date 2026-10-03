import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';

/**
 * Vérifie que le chiffrement serveur (encryptFile) et l'outil de déchiffrement
 * scripts/decrypt-intake-vault.mjs sont interopérables : même dérivation de clé
 * (scrypt + sel HMAC déterministe) et même format [iv][tag][ciphertext].
 *
 * Ce test garantit qu'un coffre-fort exporté peut réellement être rouvert.
 */

const ALGORITHM = 'aes-256-gcm';

// Réplique EXACTE de la dérivation dans scripts/decrypt-intake-vault.mjs
// (elle-même alignée sur src/lib/security/encryption.ts getMasterKeyOrThrow()).
function deriveKey(masterKey: string): Buffer {
  const salt = crypto
    .createHmac('sha256', 'memolib-key-derivation-v1')
    .update(masterKey)
    .digest()
    .subarray(0, 16);
  return crypto.scryptSync(masterKey, salt, 32, { N: 16384, r: 8, p: 1 });
}

function decryptBuffer(data: Buffer, key: Buffer): Buffer {
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

const MASTER_KEY = 'test-master-key-of-sufficient-length-1234567890';

describe('coffre-fort intake — interopérabilité chiffrement/déchiffrement', () => {
  let encryptFile: (data: Buffer) => Promise<Buffer>;

  beforeAll(async () => {
    process.env.ENCRYPTION_MASTER_KEY = MASTER_KEY;
    // Import après avoir défini la clé (le module lit process.env à l'appel).
    ({ encryptFile } = await import('@/lib/security/encryption'));
  });

  it('un buffer chiffré par le serveur est déchiffrable par l’outil scripts/', async () => {
    const original = Buffer.from('PK\u0003\u0004 contenu xlsx factice — données sensibles', 'utf8');

    const encrypted = await encryptFile(original);
    // Format attendu : au moins iv(16)+tag(16) + données.
    expect(encrypted.length).toBeGreaterThan(32);

    const key = deriveKey(MASTER_KEY);
    const decrypted = decryptBuffer(encrypted, key);

    expect(decrypted.equals(original)).toBe(true);
  });

  it('échoue avec une mauvaise clé (intégrité GCM)', async () => {
    const encrypted = await encryptFile(Buffer.from('secret'));
    const wrongKey = deriveKey('wrong-master-key-also-long-enough-0987654321');
    expect(() => decryptBuffer(encrypted, wrongKey)).toThrow();
  });
});
