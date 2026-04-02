/**
 * Tests pour les utilitaires cryptographiques
 * Couverture: hash, vérification, audit events
 */

import {
  calculateHash,
  verifyHash,
  hashAuditEvent,
  hashDocument,
} from '@/lib/crypto';

describe('Crypto Utilities', () => {
  describe('calculateHash', () => {
    it('devrait calculer un hash SHA-256 pour une string', () => {
      const hash = calculateHash('test');
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA-256 = 64 caractères hex
    });

    it('devrait retourner le même hash pour les mêmes données', () => {
      const hash1 = calculateHash('test data');
      const hash2 = calculateHash('test data');
      expect(hash1).toBe(hash2);
    });

    it('devrait retourner des hash différents pour des données différentes', () => {
      const hash1 = calculateHash('data1');
      const hash2 = calculateHash('data2');
      expect(hash1).not.toBe(hash2);
    });

    it('devrait gérer les caractères spéciaux', () => {
      const hash = calculateHash('données avec accénts & symboles €');
      expect(hash).toHaveLength(64);
    });

    it('devrait gérer les chaînes vides', () => {
      const hash = calculateHash('');
      expect(hash).toHaveLength(64);
    });

    it('devrait gérer un Buffer', () => {
      const buffer = Buffer.from('test data');
      const hash = calculateHash(buffer);
      expect(hash).toHaveLength(64);
    });

    it('devrait donner le même hash pour string et Buffer équivalents', () => {
      const str = 'test data';
      const buffer = Buffer.from(str);
      expect(calculateHash(str)).toBe(calculateHash(buffer));
    });
  });

  describe('verifyHash', () => {
    it('devrait retourner true pour un hash valide', () => {
      const data = 'test data';
      const hash = calculateHash(data);
      expect(verifyHash(data, hash)).toBe(true);
    });

    it('devrait retourner false pour un hash invalide', () => {
      const data = 'test data';
      const wrongHash = 'a'.repeat(64);
      expect(verifyHash(data, wrongHash)).toBe(false);
    });

    it('devrait retourner false si les données sont modifiées', () => {
      const originalData = 'test data';
      const hash = calculateHash(originalData);
      const modifiedData = 'test data modified';
      expect(verifyHash(modifiedData, hash)).toBe(false);
    });

    it('devrait détecter même les petites modifications', () => {
      const data1 = 'test data';
      const data2 = 'test datA'; // Une lettre différente
      const hash = calculateHash(data1);
      expect(verifyHash(data2, hash)).toBe(false);
    });
  });

  describe('hashAuditEvent', () => {
    it('devrait hasher un événement d\'audit complet', () => {
      const event = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        objectType: 'DOSSIER',
        objectId: 'dossier-1',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        metadata: { ip: '127.0.0.1' },
      };

      const hash = hashAuditEvent(event);
      expect(hash).toHaveLength(64);
    });

    it('devrait retourner le même hash pour le même événement', () => {
      const event = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        objectType: 'DOSSIER',
        objectId: 'dossier-1',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const hash1 = hashAuditEvent(event);
      const hash2 = hashAuditEvent(event);
      expect(hash1).toBe(hash2);
    });

    it('devrait gérer les valeurs null', () => {
      const event = {
        tenantId: null,
        userId: null,
        action: 'SYSTEM_EVENT',
        objectType: 'SYSTEM',
        objectId: null,
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const hash = hashAuditEvent(event);
      expect(hash).toHaveLength(64);
    });

    it('devrait gérer timestamp string', () => {
      const event = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        objectType: 'DOSSIER',
        objectId: 'dossier-1',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const hash = hashAuditEvent(event);
      expect(hash).toHaveLength(64);
    });

    it('devrait produire des hash différents pour des événements différents', () => {
      const event1 = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        action: 'CREATE',
        objectType: 'DOSSIER',
        objectId: 'dossier-1',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const event2 = {
        ...event1,
        action: 'UPDATE',
      };

      expect(hashAuditEvent(event1)).not.toBe(hashAuditEvent(event2));
    });
  });

  describe('hashDocument', () => {
    it('devrait hasher un document avec ses métadonnées', () => {
      const file = Buffer.from('contenu du document');
      const metadata = {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const hash = hashDocument(file, metadata);
      expect(hash).toHaveLength(64);
    });

    it('devrait retourner le même hash pour le même document', () => {
      const file = Buffer.from('contenu du document');
      const metadata = {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const hash1 = hashDocument(file, metadata);
      const hash2 = hashDocument(file, metadata);
      expect(hash1).toBe(hash2);
    });

    it('devrait produire un hash différent si le contenu change', () => {
      const file1 = Buffer.from('contenu original');
      const file2 = Buffer.from('contenu modifié');
      const metadata = {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      expect(hashDocument(file1, metadata)).not.toBe(hashDocument(file2, metadata));
    });

    it('devrait produire un hash différent si les métadonnées changent', () => {
      const file = Buffer.from('contenu du document');
      const metadata1 = {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };
      const metadata2 = {
        ...metadata1,
        filename: 'autre-document.pdf',
      };

      expect(hashDocument(file, metadata1)).not.toBe(hashDocument(file, metadata2));
    });

    it('devrait gérer timestamp string', () => {
      const file = Buffer.from('contenu');
      const metadata = {
        filename: 'doc.pdf',
        mimeType: 'application/pdf',
        uploadedBy: 'user-1',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const hash = hashDocument(file, metadata);
      expect(hash).toHaveLength(64);
    });
  });

  describe('Cas d\'utilisation réels', () => {
    it('devrait permettre la vérification d\'intégrité d\'un document', () => {
      const originalContent = Buffer.from('Document juridique important');
      const originalHash = calculateHash(originalContent);

      // Simulation: le document est stocké puis récupéré
      const retrievedContent = Buffer.from('Document juridique important');
      expect(verifyHash(retrievedContent, originalHash)).toBe(true);
    });

    it('devrait détecter une altération de document', () => {
      const originalContent = Buffer.from('Contrat original');
      const originalHash = calculateHash(originalContent);

      // Simulation: le document a été altéré
      const tamperedContent = Buffer.from('Contrat altéré');
      expect(verifyHash(tamperedContent, originalHash)).toBe(false);
    });

    it('devrait créer une chaîne d\'intégrité pour audit', () => {
      // Simulation d'une chaîne d'audit
      let previousHash = '';

      const events = [
        { action: 'CREATE', objectType: 'DOSSIER', objectId: '1', timestamp: new Date() },
        { action: 'UPDATE', objectType: 'DOSSIER', objectId: '1', timestamp: new Date() },
        { action: 'DELETE', objectType: 'DOSSIER', objectId: '1', timestamp: new Date() },
      ];

      const hashes = events.map((event, index) => {
        const eventWithPrevious = { ...event, previousHash };
        const hash = hashAuditEvent(eventWithPrevious);
        previousHash = hash;
        return hash;
      });

      // Tous les hash sont uniques
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(3);
    });
  });
});
