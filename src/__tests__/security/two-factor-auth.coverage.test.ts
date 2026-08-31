/**
 * Tests pour src/lib/security/two-factor-auth.ts
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('otplib', () => ({
  authenticator: {
    generateSecret: vi.fn(() => 'MOCK_SECRET_BASE32'),
    keyuri: vi.fn((email, app, secret) => `otpauth://totp/${app}:${email}?secret=${secret}`),
    check: vi.fn((token, secret) => token === '123456'),
  },
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async () => 'data:image/png;base64,MOCK_QR_DATA'),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import {
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  is2FARequired,
  setup2FA,
  validate2FALogin,
  require2FA,
} from '@/lib/security/two-factor-auth';

describe('two-factor-auth.ts — Full Coverage', () => {
  describe('generate2FASecret', () => {
    it('should generate secret and QR URL', () => {
      const result = generate2FASecret('user@test.com');
      expect(result.secret).toBe('MOCK_SECRET_BASE32');
      expect(result.qrCodeUrl).toContain('otpauth://totp/');
      expect(result.qrCodeUrl).toContain('user@test.com');
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code data URL', async () => {
      const result = await generateQRCode('otpauth://totp/test');
      expect(result).toContain('data:image/png');
    });

    it('should throw on error', async () => {
      const QRCode = await import('qrcode');
      vi.mocked(QRCode.default.toDataURL).mockRejectedValueOnce(new Error('QR fail'));
      await expect(generateQRCode('bad')).rejects.toThrow('Failed to generate QR code');
    });
  });

  describe('verify2FAToken', () => {
    it('should return true for valid token', () => {
      expect(verify2FAToken('123456', 'secret')).toBe(true);
    });

    it('should return false for invalid token', () => {
      expect(verify2FAToken('000000', 'secret')).toBe(false);
    });

    it('should return false on error', async () => {
      const otplib = await import('otplib');
      vi.mocked(otplib.authenticator.check).mockImplementationOnce(() => { throw new Error('fail'); });
      expect(verify2FAToken('123456', 'secret')).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 codes by default', () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-F0-9]{8}$/);
      });
    });

    it('should generate custom number of codes', () => {
      const codes = generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it('should generate unique codes', () => {
      const codes = generateBackupCodes(20);
      const unique = new Set(codes);
      expect(unique.size).toBe(20);
    });
  });

  describe('hashBackupCode', () => {
    it('should return SHA256 hash', () => {
      const hash = hashBackupCode('ABCD1234');
      expect(hash).toHaveLength(64); // SHA256 hex = 64 chars
    });

    it('should be deterministic', () => {
      expect(hashBackupCode('TEST')).toBe(hashBackupCode('TEST'));
    });

    it('should be different for different codes', () => {
      expect(hashBackupCode('AAA')).not.toBe(hashBackupCode('BBB'));
    });
  });

  describe('verifyBackupCode', () => {
    it('should return true for valid backup code', () => {
      const code = 'MYCODE01';
      const hashed = hashBackupCode(code);
      expect(verifyBackupCode(code, [hashed, 'other_hash'])).toBe(true);
    });

    it('should return false for invalid backup code', () => {
      expect(verifyBackupCode('INVALID', ['hash1', 'hash2'])).toBe(false);
    });
  });

  describe('is2FARequired', () => {
    it('should require 2FA for SUPER_ADMIN', () => {
      expect(is2FARequired('SUPER_ADMIN')).toBe(true);
    });

    it('should require 2FA for ADMIN', () => {
      expect(is2FARequired('ADMIN')).toBe(true);
    });

    it('should not require 2FA for USER', () => {
      expect(is2FARequired('USER')).toBe(false);
    });

    it('should not require 2FA for LAWYER', () => {
      expect(is2FARequired('LAWYER')).toBe(false);
    });
  });

  describe('setup2FA', () => {
    it('should return complete setup data', async () => {
      const setup = await setup2FA('test@test.com');
      expect(setup.secret).toBe('MOCK_SECRET_BASE32');
      expect(setup.qrCode).toContain('data:image/png');
      expect(setup.backupCodes).toHaveLength(10);
    });
  });

  describe('validate2FALogin', () => {
    it('should succeed with valid TOTP token', async () => {
      const result = await validate2FALogin('user1', '123456', 'secret', []);
      expect(result.success).toBe(true);
      expect(result.usedBackupCode).toBeUndefined();
    });

    it('should succeed with valid backup code', async () => {
      const code = 'BACKUP01';
      const hashed = hashBackupCode(code);
      const result = await validate2FALogin('user1', code, 'secret', [hashed]);
      expect(result.success).toBe(true);
      expect(result.usedBackupCode).toBe(true);
    });

    it('should fail with invalid token and invalid backup', async () => {
      const result = await validate2FALogin('user1', '000000', 'secret', ['some_hash']);
      expect(result.success).toBe(false);
    });
  });

  describe('require2FA decorator', () => {
    it('should throw when 2FA not verified for admin', async () => {
      const decorator = require2FA('ADMIN');
      const descriptor: PropertyDescriptor = {
        value: async () => 'success',
      };
      
      const modified = decorator({}, 'method', descriptor);
      const method = modified.value;

      await expect(method({ session: { user: { twoFactorVerified: false } } }))
        .rejects.toThrow('2FA verification required');
    });

    it('should allow when 2FA verified', async () => {
      const decorator = require2FA('ADMIN');
      const descriptor: PropertyDescriptor = {
        value: async () => 'success',
      };
      
      const modified = decorator({}, 'method', descriptor);
      const result = await modified.value({ session: { user: { twoFactorVerified: true } } });
      expect(result).toBe('success');
    });

    it('should allow non-admin roles without 2FA', async () => {
      const decorator = require2FA('USER');
      const descriptor: PropertyDescriptor = {
        value: async () => 'allowed',
      };
      
      const modified = decorator({}, 'method', descriptor);
      const result = await modified.value({ session: { user: { twoFactorVerified: false } } });
      expect(result).toBe('allowed');
    });
  });
});
