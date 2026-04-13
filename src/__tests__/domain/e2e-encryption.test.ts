/**
 * @jest-environment jsdom
 */
import {
  e2eEncrypt,
  e2eDecrypt,
  e2eEncryptFile,
  e2eDecryptFile,
  encryptSensitiveFields,
  decryptSensitiveFields,
} from '@/lib/security/e2e-encryption';

describe('E2E Encryption', () => {
  const passphrase = 'cabinet-secret-2024!';

  describe('Text encryption', () => {
    it('devrait chiffrer et déchiffrer un texte', async () => {
      const plaintext = 'Données confidentielles du client';
      const encrypted = await e2eEncrypt(plaintext, passphrase);

      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe('string');

      const decrypted = await e2eDecrypt(encrypted, passphrase);
      expect(decrypted).toBe(plaintext);
    });

    it('devrait produire des chiffrés différents pour le même texte (IV aléatoire)', async () => {
      const plaintext = 'test';
      const a = await e2eEncrypt(plaintext, passphrase);
      const b = await e2eEncrypt(plaintext, passphrase);
      expect(a).not.toBe(b);
    });

    it('devrait échouer avec un mauvais mot de passe', async () => {
      const encrypted = await e2eEncrypt('secret', passphrase);
      await expect(e2eDecrypt(encrypted, 'wrong-password')).rejects.toThrow();
    });

    it('devrait gérer les caractères spéciaux et unicode', async () => {
      const plaintext = '日本語テスト 🔐 àéîõü ñ';
      const encrypted = await e2eEncrypt(plaintext, passphrase);
      const decrypted = await e2eDecrypt(encrypted, passphrase);
      expect(decrypted).toBe(plaintext);
    });

    it('devrait gérer une chaîne vide', async () => {
      const encrypted = await e2eEncrypt('', passphrase);
      const decrypted = await e2eDecrypt(encrypted, passphrase);
      expect(decrypted).toBe('');
    });
  });

  describe('File encryption', () => {
    it('devrait chiffrer et déchiffrer un fichier', async () => {
      const content = new TextEncoder().encode('Contenu du document PDF');
      const encrypted = await e2eEncryptFile(content.buffer, passphrase);

      expect(encrypted.byteLength).toBeGreaterThan(content.byteLength);

      const decrypted = await e2eDecryptFile(encrypted, passphrase);
      const result = new TextDecoder().decode(decrypted);
      expect(result).toBe('Contenu du document PDF');
    });

    it('devrait échouer avec un mauvais mot de passe', async () => {
      const content = new TextEncoder().encode('secret file');
      const encrypted = await e2eEncryptFile(content.buffer, passphrase);
      await expect(e2eDecryptFile(encrypted, 'wrong')).rejects.toThrow();
    });
  });

  describe('Sensitive fields', () => {
    it('devrait chiffrer uniquement les champs sensibles', async () => {
      const data = {
        id: '123',
        name: 'Jean Dupont',
        phone: '0612345678',
        address: '12 rue de Paris',
        notes: 'Client prioritaire',
      };

      const encrypted = await encryptSensitiveFields(data, passphrase);

      // Non-sensitive fields unchanged
      expect(encrypted.id).toBe('123');
      expect(encrypted.name).toBe('Jean Dupont');

      // Sensitive fields encrypted
      expect(encrypted.phone).not.toBe('0612345678');
      expect(encrypted.address).not.toBe('12 rue de Paris');
      expect(encrypted.notes).not.toBe('Client prioritaire');

      // Round-trip
      const decrypted = await decryptSensitiveFields(encrypted, passphrase);
      expect(decrypted.phone).toBe('0612345678');
      expect(decrypted.address).toBe('12 rue de Paris');
      expect(decrypted.notes).toBe('Client prioritaire');
    });

    it('devrait ignorer les champs vides ou absents', async () => {
      const data = { id: '1', phone: '', address: undefined as unknown as string };
      const encrypted = await encryptSensitiveFields(data, passphrase);
      expect(encrypted.phone).toBe('');
      expect(encrypted.address).toBeUndefined();
    });
  });
});
