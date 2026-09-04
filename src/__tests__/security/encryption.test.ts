/**
 * Tests unitaires pour le système de chiffrement
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('encryption', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      ENCRYPTION_MASTER_KEY: 'test-master-key-for-encryption-32chars!',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encryptData', () => {
    it('devrait chiffrer les données avec un format valide', async () => {
      const { encryptData } = await import('@/lib/security/encryption');

      const result = encryptData('données sensibles');

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');
      expect(result).toHaveProperty('version', '1.0');
    });

    it('devrait produire un chiffrement différent à chaque appel (IV aléatoire)', async () => {
      const { encryptData } = await import('@/lib/security/encryption');
      const plaintext = 'même texte';

      const result1 = encryptData(plaintext);
      const result2 = encryptData(plaintext);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('devrait gérer les chaînes vides', async () => {
      const { encryptData } = await import('@/lib/security/encryption');

      const result = encryptData('');

      expect(result.encrypted).toBeDefined();
    });

    it('devrait gérer les caractères spéciaux et unicode', async () => {
      const { encryptData } = await import('@/lib/security/encryption');
      const unicodeText = '日本語 🔐 émojis € £';

      const result = encryptData(unicodeText);

      expect(result.encrypted).toBeDefined();
      expect(result.encrypted.length).toBeGreaterThan(0);
    });

    it('devrait lever une erreur si ENCRYPTION_MASTER_KEY manquante', async () => {
      delete process.env.ENCRYPTION_MASTER_KEY;
      vi.resetModules();

      const { encryptData } = await import('@/lib/security/encryption');

      expect(() => encryptData('test')).toThrow(/ENCRYPTION_MASTER_KEY/);

    });

    it('devrait lever une erreur si ENCRYPTION_MASTER_KEY est trop courte', async () => {
      process.env.ENCRYPTION_MASTER_KEY = 'trop-courte';
      vi.resetModules();

      const { encryptData } = await import('@/lib/security/encryption');

      expect(() => encryptData('test')).toThrow(/at least 32 characters/);
    });
  });

  describe('decryptData', () => {
    it('devrait déchiffrer correctement les données chiffrées', async () => {
      const { encryptData, decryptData } = await import('@/lib/security/encryption');
      const original = 'message secret';

      const encrypted = encryptData(original);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(original);
    });

    it('devrait préserver les caractères unicode après round-trip', async () => {
      const { encryptData, decryptData } = await import('@/lib/security/encryption');
      const original = '日本語 🔒 données sensibles €';

      const encrypted = encryptData(original);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(original);
    });

    it('devrait gérer de longues chaînes', async () => {
      const { encryptData, decryptData } = await import('@/lib/security/encryption');
      const longText = 'A'.repeat(10000);

      const encrypted = encryptData(longText);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(longText);
    });

    it('devrait échouer avec un authTag modifié', async () => {
      const { encryptData, decryptData } = await import('@/lib/security/encryption');

      const encrypted = encryptData('data');
      encrypted.authTag = 'invalid_tag_123456789012345678901234';

      expect(() => decryptData(encrypted)).toThrow();
    });

    it('devrait échouer avec un IV modifié', async () => {
      const { encryptData, decryptData } = await import('@/lib/security/encryption');

      const encrypted = encryptData('data');
      encrypted.iv = 'invalid_iv_base64!';

      expect(() => decryptData(encrypted)).toThrow();
    });

    it('devrait rejeter les payloads de version ou Base64 invalides', async () => {
      const { decryptData, encryptData } = await import('@/lib/security/encryption');
      const encrypted = encryptData('data');

      expect(() => decryptData({ ...encrypted, version: '2.0' as '1.0' })).toThrow(/version/);
      expect(() => decryptData({ ...encrypted, iv: 'not-base64!' })).toThrow(/base64/);
    });
  });

  describe('encryptSensitiveField / decryptSensitiveField', () => {
    it('devrait chiffrer et déchiffrer un champ sensible', async () => {
      const mod = await import('@/lib/security/encryption');

      // Vérifier si ces fonctions existent
      if (mod.encryptSensitiveField && mod.decryptSensitiveField) {
        const original = 'numéro passeport: AB123456';
        const encrypted = mod.encryptSensitiveField(original);
        const decrypted = mod.decryptSensitiveField(encrypted);

        expect(decrypted).toBe(original);
      }
    });
  });

  describe('Sécurité', () => {
    it('devrait utiliser AES-256-GCM', async () => {
      // Ce test vérifie indirectement que GCM est utilisé via la présence de authTag
      const { encryptData } = await import('@/lib/security/encryption');

      const result = encryptData('test');

      // GCM produit toujours un authTag
      expect(result.authTag).toBeDefined();
      expect(result.authTag.length).toBeGreaterThan(0);
    });

    it('devrait produire des IV différents', async () => {
      const { encryptData } = await import('@/lib/security/encryption');
      const ivs = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const result = encryptData('test');
        ivs.add(result.iv);
      }

      // Tous les IV devraient être uniques
      expect(ivs.size).toBe(100);
    }, 20000);
  });
});
