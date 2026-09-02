/**
 * Tests exhaustifs pour src/lib/security/encryption.ts
 * Objectif: couvrir 100% du module
 */

import crypto from 'crypto';

// Set ENCRYPTION_MASTER_KEY before importing
process.env.ENCRYPTION_MASTER_KEY = 'test-master-key-for-unit-tests-32chars!';

import {
  encryptData,
  decryptData,
  encryptSensitiveField,
  decryptSensitiveField,
  EncryptionService,
  encryptFile,
  decryptFile,
  encryptionMiddleware,
  EncryptedDataPayload,
} from '@/lib/security/encryption';

describe('encryption.ts — Full Coverage', () => {
  describe('getMasterKeyOrThrow (via encryptData)', () => {
    it('should throw when ENCRYPTION_MASTER_KEY is not set', () => {
      const original = process.env.ENCRYPTION_MASTER_KEY;
      delete process.env.ENCRYPTION_MASTER_KEY;
      
      expect(() => encryptData('test')).toThrow('ENCRYPTION_MASTER_KEY must be configured');
      
      process.env.ENCRYPTION_MASTER_KEY = original;
    });

    it('should work when ENCRYPTION_MASTER_KEY is set', () => {
      const payload = encryptData('hello');
      expect(payload).toHaveProperty('encrypted');
      expect(payload).toHaveProperty('iv');
      expect(payload).toHaveProperty('authTag');
      expect(payload.version).toBe('1.0');
    });
  });

  describe('encryptData / decryptData', () => {
    it('should roundtrip encrypt and decrypt text', () => {
      const plaintext = 'Bonjour le monde juridique!';
      const encrypted = encryptData(plaintext);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'test';
      const a = encryptData(plaintext);
      const b = encryptData(plaintext);
      expect(a.encrypted).not.toBe(b.encrypted);
      expect(a.iv).not.toBe(b.iv);
    });

    it('should handle empty string', () => {
      const encrypted = encryptData('');
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle unicode text', () => {
      const plaintext = 'Ça été décidé — arrêté préfectoral n°2024/123 éàü';
      const encrypted = encryptData(plaintext);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle very long text', () => {
      const plaintext = 'A'.repeat(100000);
      const encrypted = encryptData(plaintext);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encryptSensitiveField / decryptSensitiveField', () => {
    it('should be aliases for encryptData/decryptData', () => {
      const value = 'AB1234567';
      const encrypted = encryptSensitiveField(value);
      const decrypted = decryptSensitiveField(encrypted);
      expect(decrypted).toBe(value);
    });
  });

  describe('EncryptionService.encrypt / decrypt', () => {
    it('should roundtrip encrypt and decrypt', () => {
      const text = 'passport number P12345';
      const encrypted = EncryptionService.encrypt(text);
      const decrypted = EncryptionService.decrypt(encrypted);
      expect(decrypted).toBe(text);
    });

    it('should return format iv:authTag:encrypted', () => {
      const encrypted = EncryptionService.encrypt('test');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      // IV = 16 bytes = 32 hex chars
      expect(parts[0]).toHaveLength(32);
      // AuthTag = 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32);
      // Encrypted data (hex)
      expect(parts[2].length).toBeGreaterThan(0);
    });

    it('should return empty/falsy values unchanged', () => {
      expect(EncryptionService.encrypt('')).toBe('');
      expect(EncryptionService.encrypt(null as any)).toBe(null);
      expect(EncryptionService.encrypt(undefined as any)).toBe(undefined);
    });

    it('should return non-encrypted strings unchanged on decrypt', () => {
      expect(EncryptionService.decrypt('')).toBe('');
      expect(EncryptionService.decrypt('no-colon-here')).toBe('no-colon-here');
      expect(EncryptionService.decrypt(null as any)).toBe(null);
    });

    it('should handle invalid encrypted text gracefully', () => {
      const invalid = 'aaa:bbb:ccc';
      // Should return original on decryption failure
      const result = EncryptionService.decrypt(invalid);
      expect(result).toBe(invalid);
    });
  });

  describe('EncryptionService.encryptSensitiveFields / decryptSensitiveFields', () => {
    it('should encrypt all sensitive fields', () => {
      const data = {
        passportNumber: 'AB123456',
        phone: '+33612345678',
        phoneSecondaire: '+33698765432',
        telephoneUrgence: '+33611111111',
        address: '12 rue de Paris',
        dateOfBirth: '1990-01-15',
        lieuNaissance: 'Lyon',
        nationaliteOrigine: 'Française',
        nom: 'Dupont', // Should NOT be encrypted
      };

      const encrypted = EncryptionService.encryptSensitiveFields(data);

      // Sensitive fields should be encrypted (contain colons = hex format)
      expect(encrypted.passportNumber).toContain(':');
      expect(encrypted.phone).toContain(':');
      expect(encrypted.phoneSecondaire).toContain(':');
      expect(encrypted.telephoneUrgence).toContain(':');
      expect(encrypted.address).toContain(':');
      expect(encrypted.dateOfBirth).toContain(':');
      expect(encrypted.lieuNaissance).toContain(':');
      expect(encrypted.nationaliteOrigine).toContain(':');

      // Non-sensitive fields should NOT be encrypted
      expect(encrypted.nom).toBe('Dupont');
    });

    it('should roundtrip encrypt/decrypt sensitive fields', () => {
      const data = {
        passportNumber: 'AB123456',
        phone: '+33612345678',
        address: '12 rue de Paris',
        nom: 'Dupont',
      };

      const encrypted = EncryptionService.encryptSensitiveFields(data);
      const decrypted = EncryptionService.decryptSensitiveFields(encrypted);

      expect(decrypted.passportNumber).toBe('AB123456');
      expect(decrypted.phone).toBe('+33612345678');
      expect(decrypted.address).toBe('12 rue de Paris');
      expect(decrypted.nom).toBe('Dupont');
    });

    it('should skip null/undefined fields', () => {
      const data = {
        passportNumber: null,
        phone: undefined,
        address: '',
      };

      const encrypted = EncryptionService.encryptSensitiveFields(data);
      expect(encrypted.passportNumber).toBeNull();
      expect(encrypted.phone).toBeUndefined();
      expect(encrypted.address).toBe('');
    });
  });

  describe('encryptFile / decryptFile', () => {
    it('should roundtrip encrypt and decrypt a file buffer', async () => {
      const fileContent = Buffer.from('PDF content simulation with binary data \x00\x01\x02');
      const encrypted = await encryptFile(fileContent);
      const decrypted = await decryptFile(encrypted);
      expect(decrypted).toEqual(fileContent);
    });

    it('should produce binary format [iv(16)][tag(16)][ciphertext]', async () => {
      const fileContent = Buffer.from('test');
      const encrypted = await encryptFile(fileContent);
      // Minimum size: 16 (iv) + 16 (tag) + encrypted data
      expect(encrypted.length).toBeGreaterThan(32);
    });

    it('should throw if payload is too short', async () => {
      const shortPayload = Buffer.alloc(20); // < 32 bytes
      await expect(decryptFile(shortPayload)).rejects.toThrow('Encrypted payload is too short');
    });

    it('should handle large files', async () => {
      const largeFile = crypto.randomBytes(1024 * 50); // 50KB
      const encrypted = await encryptFile(largeFile);
      const decrypted = await decryptFile(encrypted);
      expect(decrypted).toEqual(largeFile);
    });

    it('should handle empty file', async () => {
      const emptyFile = Buffer.alloc(0);
      const encrypted = await encryptFile(emptyFile);
      const decrypted = await decryptFile(encrypted);
      expect(decrypted).toEqual(emptyFile);
    });
  });

  describe('encryptionMiddleware', () => {
    it('should encrypt data on Client create', async () => {
      const args = {
        data: {
          passportNumber: 'AB123',
          phone: '+33600000000',
          nom: 'Test',
        },
      };

      const mockQuery = vi.fn().mockResolvedValue({ id: '1', ...args.data });

      await encryptionMiddleware.$allOperations({
        operation: 'create',
        model: 'Client',
        args,
        query: mockQuery,
      });

      // Should have called query with encrypted fields
      const calledArgs = mockQuery.mock.calls[0][0];
      expect(calledArgs.data.passportNumber).toContain(':');
      expect(calledArgs.data.phone).toContain(':');
      expect(calledArgs.data.nom).toBe('Test'); // Not encrypted
    });

    it('should encrypt data on Client update', async () => {
      const args = {
        data: {
          address: '10 rue de Lyon',
        },
      };

      const mockQuery = vi.fn().mockResolvedValue({ id: '1' });

      await encryptionMiddleware.$allOperations({
        operation: 'update',
        model: 'Client',
        args,
        query: mockQuery,
      });

      const calledArgs = mockQuery.mock.calls[0][0];
      expect(calledArgs.data.address).toContain(':');
    });

    it('should decrypt data on Client findMany', async () => {
      const phone = '+33611111111';
      const encryptedPhone = EncryptionService.encrypt(phone);

      const mockQuery = vi.fn().mockResolvedValue([
        { id: '1', phone: encryptedPhone, nom: 'Test' },
      ]);

      const result = await encryptionMiddleware.$allOperations({
        operation: 'findMany',
        model: 'Client',
        args: {},
        query: mockQuery,
      });

      expect(result[0].phone).toBe(phone);
      expect(result[0].nom).toBe('Test');
    });

    it('should decrypt data on Client findFirst', async () => {
      const address = '5 avenue des Champs';
      const encryptedAddress = EncryptionService.encrypt(address);

      const mockQuery = vi.fn().mockResolvedValue({
        id: '1',
        address: encryptedAddress,
      });

      const result = await encryptionMiddleware.$allOperations({
        operation: 'findFirst',
        model: 'Client',
        args: {},
        query: mockQuery,
      });

      expect(result.address).toBe(address);
    });

    it('should decrypt data on Client findUnique', async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        id: '1',
        passportNumber: EncryptionService.encrypt('P999'),
      });

      const result = await encryptionMiddleware.$allOperations({
        operation: 'findUnique',
        model: 'Client',
        args: {},
        query: mockQuery,
      });

      expect(result.passportNumber).toBe('P999');
    });

    it('should return null when findFirst returns null', async () => {
      const mockQuery = vi.fn().mockResolvedValue(null);

      const result = await encryptionMiddleware.$allOperations({
        operation: 'findFirst',
        model: 'Client',
        args: {},
        query: mockQuery,
      });

      expect(result).toBeNull();
    });

    it('should NOT encrypt/decrypt for non-Client models', async () => {
      const args = { data: { phone: '+33600000000' } };
      const mockQuery = vi.fn().mockResolvedValue({ id: '1', phone: '+33600000000' });

      const result = await encryptionMiddleware.$allOperations({
        operation: 'create',
        model: 'Dossier',
        args,
        query: mockQuery,
      });

      // Should pass through without modification
      expect(mockQuery).toHaveBeenCalledWith(args);
      expect(result.phone).toBe('+33600000000');
    });

    it('should handle create without data field', async () => {
      const args = {};
      const mockQuery = vi.fn().mockResolvedValue({ id: '1' });

      await encryptionMiddleware.$allOperations({
        operation: 'create',
        model: 'Client',
        args,
        query: mockQuery,
      });

      expect(mockQuery).toHaveBeenCalledWith(args);
    });
  });
});
