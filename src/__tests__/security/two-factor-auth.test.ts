/**
 * Tests unitaires pour le système 2FA
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock les dépendances externes
jest.mock('@otplib/preset-default', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
    keyuri: jest
      .fn()
      .mockReturnValue(
        'otpauth://totp/IA%20Poste%20Manager:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=IA%20Poste%20Manager'
      ),
    verify: jest.fn(),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}));

import {
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  is2FARequired,
} from '@/lib/security/two-factor-auth';

import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';

describe('two-factor-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate2FASecret', () => {
    it('devrait générer un secret et une URL TOTP', () => {
      const result = generate2FASecret('test@example.com');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCodeUrl).toContain('otpauth://totp/');
    });

    it("devrait inclure l'email dans l'URL TOTP", () => {
      generate2FASecret('user@domain.com');

      expect(authenticator.keyuri).toHaveBeenCalledWith(
        'user@domain.com',
        'IA Poste Manager',
        expect.any(String)
      );
    });
  });

  describe('generateQRCode', () => {
    it('devrait générer un QR code en base64', async () => {
      const result = await generateQRCode('otpauth://totp/test');

      expect(result).toContain('data:image/png;base64');
      expect(QRCode.toDataURL).toHaveBeenCalledWith('otpauth://totp/test');
    });

    it('devrait propager les erreurs de génération', async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValueOnce(new Error('QR error'));

      await expect(generateQRCode('invalid')).rejects.toThrow('Failed to generate QR code');
    });
  });

  describe('verify2FAToken', () => {
    it('devrait retourner true pour un token valide', () => {
      (authenticator.verify as jest.Mock).mockReturnValueOnce(true);

      const result = verify2FAToken('123456', 'JBSWY3DPEHPK3PXP');

      expect(result).toBe(true);
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: '123456',
        secret: 'JBSWY3DPEHPK3PXP',
      });
    });

    it('devrait retourner false pour un token invalide', () => {
      (authenticator.verify as jest.Mock).mockReturnValueOnce(false);

      const result = verify2FAToken('000000', 'JBSWY3DPEHPK3PXP');

      expect(result).toBe(false);
    });

    it("devrait retourner false en cas d'erreur", () => {
      (authenticator.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Verification error');
      });

      const result = verify2FAToken('123456', 'invalid_secret');

      expect(result).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('devrait générer 10 codes par défaut', () => {
      const codes = generateBackupCodes();

      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-F0-9]{8}$/); // 8 caractères hexadécimaux
      });
    });

    it('devrait générer le nombre de codes demandé', () => {
      const codes = generateBackupCodes(5);

      expect(codes).toHaveLength(5);
    });

    it('devrait générer des codes uniques', () => {
      const codes = generateBackupCodes(100);
      const uniqueCodes = new Set(codes);

      // La plupart des codes devraient être uniques (probabilité de collision très faible)
      expect(uniqueCodes.size).toBeGreaterThan(90);
    });
  });

  describe('hashBackupCode', () => {
    it('devrait hasher un code de manière déterministe', () => {
      const hash1 = hashBackupCode('ABCD1234');
      const hash2 = hashBackupCode('ABCD1234');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 64 caractères hex
    });

    it('devrait produire des hashes différents pour des codes différents', () => {
      const hash1 = hashBackupCode('CODE1111');
      const hash2 = hashBackupCode('CODE2222');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyBackupCode', () => {
    it('devrait vérifier un code de backup valide', () => {
      const code = 'TESTCODE';
      const hashedCodes = [hashBackupCode(code), hashBackupCode('OTHER')];

      const result = verifyBackupCode(code, hashedCodes);

      expect(result).toBe(true);
    });

    it('devrait rejeter un code de backup invalide', () => {
      const hashedCodes = [hashBackupCode('VALID1'), hashBackupCode('VALID2')];

      const result = verifyBackupCode('INVALID', hashedCodes);

      expect(result).toBe(false);
    });

    it('devrait rejeter si liste de codes vide', () => {
      const result = verifyBackupCode('ANYCODE', []);

      expect(result).toBe(false);
    });
  });

  describe('is2FARequired', () => {
    it('devrait exiger 2FA pour SUPER_ADMIN', () => {
      expect(is2FARequired('SUPER_ADMIN')).toBe(true);
    });

    it('devrait exiger 2FA pour ADMIN', () => {
      expect(is2FARequired('ADMIN')).toBe(true);
    });

    it('ne devrait pas exiger 2FA pour USER', () => {
      expect(is2FARequired('USER')).toBe(false);
    });

    it('ne devrait pas exiger 2FA pour GUEST', () => {
      expect(is2FARequired('GUEST')).toBe(false);
    });

    it('ne devrait pas exiger 2FA pour un rôle inconnu', () => {
      expect(is2FARequired('UNKNOWN_ROLE')).toBe(false);
    });
  });
});
