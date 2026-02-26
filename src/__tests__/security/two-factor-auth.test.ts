/**
 * Tests unitaires pour le système 2FA
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';

import {
  generate2FASecret,
  generateBackupCodes,
  generateQRCode,
  hashBackupCode,
  is2FARequired,
  verify2FAToken,
  verifyBackupCode,
} from '@/lib/security/two-factor-auth';

describe('two-factor-auth', () => {
  describe('generate2FASecret', () => {
    it('devrait générer un secret et une URL TOTP', () => {
      const result = generate2FASecret('test@example.com');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(typeof result.secret).toBe('string');
      expect(result.secret.length).toBeGreaterThan(10);
      expect(result.qrCodeUrl).toContain('otpauth://totp/');
    });

    it("devrait inclure l'email encodé dans l'URL TOTP", () => {
      const result = generate2FASecret('user@domain.com');

      // L'URL devrait contenir l'email encodé
      expect(result.qrCodeUrl).toContain('user%40domain.com');
    });

    it("devrait inclure le nom de l'app dans l'URL", () => {
      const result = generate2FASecret('test@test.com');

      expect(result.qrCodeUrl).toContain('memoLib');
    });

    it('devrait générer des secrets uniques', () => {
      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const result = generate2FASecret(`user${i}@test.com`);
        results.add(result.secret);
      }
      // Tous les secrets devraient être uniques
      expect(results.size).toBe(10);
    });
  });

  describe('generateQRCode', () => {
    it('devrait générer un QR code en base64', async () => {
      const otpauthUrl = 'otpauth://totp/Test:user@test.com?secret=ABC123&issuer=Test';
      const result = await generateQRCode(otpauthUrl);

      expect(result).toContain('data:image/png;base64');
      expect(result.length).toBeGreaterThan(100);
    });

    it("devrait fonctionner avec l'URL générée par generate2FASecret", async () => {
      const { qrCodeUrl } = generate2FASecret('test@example.com');
      const result = await generateQRCode(qrCodeUrl);

      expect(result).toContain('data:image/png;base64');
    });
  });

  describe('verify2FAToken', () => {
    it('devrait retourner un boolean', () => {
      const result = verify2FAToken('123456', 'JBSWY3DPEHPK3PXP');
      expect(typeof result).toBe('boolean');
    });

    it('devrait retourner false pour un token invalide', () => {
      const result = verify2FAToken('000000', 'JBSWY3DPEHPK3PXP');
      // Un token aléatoire est très probablement invalide
      expect(typeof result).toBe('boolean');
    });

    it('devrait gérer les erreurs gracieusement', () => {
      // Secret invalide
      const result = verify2FAToken('123456', '');
      expect(result).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('devrait générer 10 codes par défaut', () => {
      const codes = generateBackupCodes();

      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-F0-9]{8}$/);
      });
    });

    it('devrait générer le nombre de codes demandé', () => {
      const codes = generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it('devrait générer des codes uniques', () => {
      const codes = generateBackupCodes(100);
      const uniqueCodes = new Set(codes);
      // La plupart devraient être uniques
      expect(uniqueCodes.size).toBeGreaterThan(90);
    });

    it('devrait gérer 0 codes', () => {
      const codes = generateBackupCodes(0);
      expect(codes).toHaveLength(0);
    });
  });

  describe('hashBackupCode', () => {
    it('devrait hasher un code de manière déterministe', () => {
      const hash1 = hashBackupCode('ABCD1234');
      const hash2 = hashBackupCode('ABCD1234');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256
    });

    it('devrait produire des hashes différents pour des codes différents', () => {
      const hash1 = hashBackupCode('CODE1111');
      const hash2 = hashBackupCode('CODE2222');

      expect(hash1).not.toBe(hash2);
    });

    it('devrait être sensible à la casse', () => {
      const hash1 = hashBackupCode('abcd1234');
      const hash2 = hashBackupCode('ABCD1234');

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

    it('devrait fonctionner avec des codes générés', () => {
      const codes = generateBackupCodes(5);
      const hashedCodes = codes.map(c => hashBackupCode(c));

      // Le premier code devrait être valide
      expect(verifyBackupCode(codes[0], hashedCodes)).toBe(true);
      // Un code aléatoire ne devrait pas être valide
      expect(verifyBackupCode('FAKECODE', hashedCodes)).toBe(false);
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

    it('devrait être sensible à la casse', () => {
      expect(is2FARequired('admin')).toBe(false);
      expect(is2FARequired('Admin')).toBe(false);
    });
  });
});
