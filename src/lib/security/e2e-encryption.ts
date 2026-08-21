/**
 * Chiffrement End-to-End côté client (Web Crypto API)
 *
 * Le serveur ne voit JAMAIS les données en clair ni la clé.
 * La clé est dérivée du mot de passe du cabinet via PBKDF2.
 * Chaque document/champ chiffré contient son propre IV.
 *
 * Format stocké : base64(salt:iv:ciphertext)
 */

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 310_000; // OWASP 2023 recommendation
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

// Polyfill: use Node webcrypto in test/SSR, browser crypto otherwise
const getCrypto = (): Crypto => {
  if (typeof globalThis.crypto?.subtle !== 'undefined') return globalThis.crypto;
   
  return require('crypto').webcrypto as Crypto;
};

// ============================================
// KEY DERIVATION
// ============================================

async function deriveKey(
  passphrase: string,
  salt: BufferSource
): Promise<CryptoKey> {
  const c = getCrypto();
  const encoder = new TextEncoder();

  // Ensure salt is a proper Uint8Array<ArrayBuffer>, not SharedArrayBuffer
  const saltArray = salt instanceof ArrayBuffer
    ? new Uint8Array(salt)
    : new Uint8Array(salt as Uint8Array);

  const keyMaterial = await c.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return c.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltArray, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ============================================
// ENCRYPT / DECRYPT
// ============================================

export async function e2eEncrypt(
  plaintext: string,
  passphrase: string
): Promise<string> {
  const c = getCrypto();
  const encoder = new TextEncoder();
  const salt = c.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = c.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await c.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoder.encode(plaintext)
  );

  // Concat salt + iv + ciphertext → single base64 string
  const payload = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  payload.set(salt, 0);
  payload.set(iv, salt.length);
  payload.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...payload));
}

export async function e2eDecrypt(
  encoded: string,
  passphrase: string
): Promise<string> {
  const c = getCrypto();
  const raw = Uint8Array.from(atob(encoded), ch => ch.charCodeAt(0));

  const salt = raw.slice(0, SALT_LENGTH);
  const iv = raw.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = raw.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(passphrase, salt);

  const decrypted = await c.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ============================================
// FILE ENCRYPTION
// ============================================

export async function e2eEncryptFile(
  data: ArrayBuffer,
  passphrase: string
): Promise<ArrayBuffer> {
  const c = getCrypto();
  const salt = c.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = c.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await c.subtle.encrypt(
    { name: ALGO, iv },
    key,
    data
  );

  // [salt(16)][iv(12)][ciphertext]
  const result = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return result.buffer;
}

export async function e2eDecryptFile(
  data: ArrayBuffer,
  passphrase: string
): Promise<ArrayBuffer> {
  const c = getCrypto();
  const raw = new Uint8Array(data);

  const salt = raw.slice(0, SALT_LENGTH);
  const iv = raw.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = raw.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(passphrase, salt);

  return c.subtle.decrypt({ name: ALGO, iv }, key, ciphertext);
}

// ============================================
// SENSITIVE FIELDS HELPER
// ============================================

const SENSITIVE_FIELDS = [
  'passportNumber',
  'phone',
  'address',
  'dateOfBirth',
  'notes',
  'description',
] as const;

export async function encryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  passphrase: string
): Promise<T> {
  const result = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      (result as Record<string, unknown>)[field] = await e2eEncrypt(value, passphrase);
    }
  }
  return result;
}

export async function decryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  passphrase: string
): Promise<T> {
  const result = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      try {
        (result as Record<string, unknown>)[field] = await e2eDecrypt(value, passphrase);
      } catch {
        // Field not encrypted or wrong key — leave as-is
      }
    }
  }
  return result;
}
