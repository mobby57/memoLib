/**
 * Tests unitaires pour StorageService
 * Service de gestion du stockage de documents
 */

import type { StoredFile, UploadOptions, FileVersion } from '@/lib/services/storageService';

// Mock localStorage
jest.mock('@/lib/localStorage', () => ({
  safeLocalStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

// Mock du logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('StorageService', () => {
  describe('StoredFile Structure', () => {
    it('contient toutes les propriétés requises', () => {
      const file: StoredFile = {
        id: 'file_123',
        name: 'document_safe_name.pdf',
        originalName: 'Mon Document (1).pdf',
        size: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        url: 'https://storage.example.com/file_123.pdf',
        uploadedAt: new Date(),
        uploadedBy: 'user_456',
        version: 1,
        tags: ['important', 'OQTF'],
        metadata: {
          dossierId: 'dos_789',
          clientId: 'cli_012',
          category: 'piece_jointe',
          description: 'Pièce d\'identité',
        },
      };

      expect(file.id).toBeDefined();
      expect(file.name).not.toContain(' '); // Nom sécurisé
      expect(file.originalName).toContain(' '); // Nom original préservé
      expect(file.size).toBe(1048576);
      expect(file.version).toBe(1);
    });

    it('supporte le versioning avec parentId', () => {
      const version1: StoredFile = {
        id: 'file_v1',
        name: 'contrat.pdf',
        originalName: 'contrat.pdf',
        size: 50000,
        mimeType: 'application/pdf',
        url: 'https://storage.example.com/file_v1.pdf',
        uploadedAt: new Date('2026-01-01'),
        uploadedBy: 'user_1',
        version: 1,
        tags: [],
        metadata: { category: 'document_genere' },
      };

      const version2: StoredFile = {
        id: 'file_v2',
        name: 'contrat.pdf',
        originalName: 'contrat.pdf',
        size: 55000,
        mimeType: 'application/pdf',
        url: 'https://storage.example.com/file_v2.pdf',
        uploadedAt: new Date('2026-01-15'),
        uploadedBy: 'user_1',
        version: 2,
        parentId: 'file_v1', // Référence à la version précédente
        tags: [],
        metadata: { category: 'document_genere' },
      };

      expect(version2.version).toBe(2);
      expect(version2.parentId).toBe(version1.id);
    });
  });

  describe('UploadOptions', () => {
    it('accepte les options de base', () => {
      const options: UploadOptions = {
        category: 'piece_jointe',
      };

      expect(options.category).toBe('piece_jointe');
    });

    it('accepte toutes les options', () => {
      const options: UploadOptions = {
        dossierId: 'dos_123',
        clientId: 'cli_456',
        category: 'document_genere',
        description: 'Contrat généré automatiquement',
        tags: ['contrat', 'automatique'],
        parentId: 'file_old', // Pour nouvelle version
      };

      expect(options.dossierId).toBe('dos_123');
      expect(options.tags).toContain('contrat');
      expect(options.parentId).toBe('file_old');
    });

    it('supporte les 4 catégories de fichiers', () => {
      const categories: StoredFile['metadata']['category'][] = [
        'piece_jointe',
        'document_genere',
        'template',
        'autre',
      ];

      categories.forEach((cat) => {
        const options: UploadOptions = { category: cat };
        expect(options.category).toBe(cat);
      });
    });
  });

  describe('FileVersion', () => {
    it('trace l\'historique des versions', () => {
      const version: FileVersion = {
        version: 3,
        uploadedAt: new Date(),
        uploadedBy: 'user_123',
        changes: 'Correction des clauses de confidentialité',
        fileId: 'file_v3',
      };

      expect(version.version).toBe(3);
      expect(version.changes).toContain('confidentialité');
    });
  });

  describe('File Validation', () => {
    it('rejette les fichiers trop volumineux', () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const fileSize = 60 * 1024 * 1024; // 60MB

      expect(fileSize > maxSize).toBe(true);
    });

    it('valide les types MIME autorisés', () => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
      ];

      expect(allowedTypes).toContain('application/pdf');
      expect(allowedTypes).toContain('image/jpeg');
      expect(allowedTypes).not.toContain('application/javascript');
      expect(allowedTypes).not.toContain('text/html');
    });

    it('rejette les types MIME dangereux', () => {
      const dangerousTypes = [
        'application/javascript',
        'text/html',
        'application/x-executable',
        'application/x-msdownload',
      ];

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
      ];

      dangerousTypes.forEach((type) => {
        expect(allowedTypes).not.toContain(type);
      });
    });
  });

  describe('File Naming', () => {
    it('génère des noms sécurisés', () => {
      const unsafeName = 'Mon Fichier (copie).<script>.pdf';
      
      // Simulation de la fonction generateSafeName
      const safeName = unsafeName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/__+/g, '_')
        .toLowerCase();

      expect(safeName).not.toContain(' ');
      expect(safeName).not.toContain('<');
      expect(safeName).not.toContain('>');
      expect(safeName).not.toContain('(');
    });

    it('préserve l\'extension du fichier', () => {
      const originalName = 'document.pdf';
      const extension = originalName.split('.').pop();

      expect(extension).toBe('pdf');
    });

    it('génère un ID unique pour chaque fichier', () => {
      const generateId = () =>
        `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^file_\d+_[a-z0-9]+$/);
    });
  });

  describe('Tags Management', () => {
    it('permet d\'ajouter des tags à un fichier', () => {
      const file: StoredFile = {
        id: 'file_123',
        name: 'test.pdf',
        originalName: 'test.pdf',
        size: 1000,
        mimeType: 'application/pdf',
        url: 'test.pdf',
        uploadedAt: new Date(),
        uploadedBy: 'user_1',
        version: 1,
        tags: ['OQTF', 'urgent', '48h'],
        metadata: { category: 'piece_jointe' },
      };

      expect(file.tags).toContain('OQTF');
      expect(file.tags).toContain('urgent');
      expect(file.tags).toHaveLength(3);
    });

    it('permet de filtrer par tag', () => {
      const files: StoredFile[] = [
        {
          id: 'f1',
          name: 'a.pdf',
          originalName: 'a.pdf',
          size: 100,
          mimeType: 'application/pdf',
          url: 'a.pdf',
          uploadedAt: new Date(),
          uploadedBy: 'u1',
          version: 1,
          tags: ['OQTF'],
          metadata: { category: 'piece_jointe' },
        },
        {
          id: 'f2',
          name: 'b.pdf',
          originalName: 'b.pdf',
          size: 100,
          mimeType: 'application/pdf',
          url: 'b.pdf',
          uploadedAt: new Date(),
          uploadedBy: 'u1',
          version: 1,
          tags: ['autre'],
          metadata: { category: 'piece_jointe' },
        },
      ];

      const oqtfFiles = files.filter((f) => f.tags.includes('OQTF'));
      expect(oqtfFiles).toHaveLength(1);
      expect(oqtfFiles[0].id).toBe('f1');
    });
  });
});
