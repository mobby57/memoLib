import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'fallback-key-dev-only';
const ALGORITHM = 'aes-256-gcm';

export interface EncryptedDataPayload {
  encrypted: string;
  iv: string;
  authTag: string;
  version: '1.0';
}

function getMasterKeyOrThrow(): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY not configured');
  }

  return crypto.scryptSync(masterKey, 'salt', 32);
}

export function encryptData(plaintext: string): EncryptedDataPayload {
  const key = getMasterKeyOrThrow();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    version: '1.0',
  };
}

export function decryptData(payload: EncryptedDataPayload): string {
  const key = getMasterKeyOrThrow();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const encrypted = Buffer.from(payload.encrypted, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function encryptSensitiveField(value: string): EncryptedDataPayload {
  return encryptData(value);
}

export function decryptSensitiveField(value: EncryptedDataPayload): string {
  return decryptData(value);
}

export class EncryptionService {
  private static getKey(): Buffer {
    return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  }

  static encrypt(text: string): string {
    if (!text) return text;

    const iv = crypto.randomBytes(16);
    const key = this.getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

    try {
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = this.getKey();

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText; // Return original if decryption fails
    }
  }

  // Champs sensibles à chiffrer
  static encryptSensitiveFields(data: any): any {
    const sensitiveFields = [
      'passportNumber',
      'phone',
      'phoneSecondaire',
      'telephoneUrgence',
      'address',
      'dateOfBirth',
      'lieuNaissance',
      'nationaliteOrigine'
    ];

    const encrypted = { ...data };

    sensitiveFields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });

    return encrypted;
  }

  static decryptSensitiveFields(data: any): any {
    const sensitiveFields = [
      'passportNumber',
      'phone',
      'phoneSecondaire',
      'telephoneUrgence',
      'address',
      'dateOfBirth',
      'lieuNaissance',
      'nationaliteOrigine'
    ];

    const decrypted = { ...data };

    sensitiveFields.forEach(field => {
      if (decrypted[field]) {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    });

    return decrypted;
  }
}

export async function encryptFile(data: Buffer): Promise<Buffer> {
  const iv = crypto.randomBytes(16);
  const key = EncryptionService['getKey']();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Payload format: [iv(16)][tag(16)][ciphertext]
  return Buffer.concat([iv, authTag, encrypted]);
}

export async function decryptFile(data: Buffer): Promise<Buffer> {
  if (data.length < 32) {
    throw new Error('Encrypted payload is too short');
  }

  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);
  const key = EncryptionService['getKey']();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// Middleware Prisma pour chiffrement automatique
export const encryptionMiddleware = {
  async $allOperations({ operation, model, args, query }) {
    if (model === 'Client') {
      if (operation === 'create' || operation === 'update') {
        if (args.data) {
          args.data = EncryptionService.encryptSensitiveFields(args.data);
        }
      }

      const result = await query(args);

      if (operation === 'findMany' || operation === 'findFirst' || operation === 'findUnique') {
        if (Array.isArray(result)) {
          return result.map(item => EncryptionService.decryptSensitiveFields(item));
        } else if (result) {
          return EncryptionService.decryptSensitiveFields(result);
        }
      }

      return result;
    }

    return query(args);
  }
};
