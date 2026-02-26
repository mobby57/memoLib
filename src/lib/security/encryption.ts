import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'fallback-key-dev-only';
const ALGORITHM = 'aes-256-gcm';

export class EncryptionService {
  private static getKey(): Buffer {
    return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  }

  static encrypt(text: string): string {
    if (!text) return text;
    
    const iv = crypto.randomBytes(16);
    const key = this.getKey();
    const cipher = crypto.createCipher(ALGORITHM, key);
    
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
      
      const decipher = crypto.createDecipher(ALGORITHM, key);
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