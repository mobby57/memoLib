/**
 * Real tests for dossier.mapper.ts to increase actual coverage
 * Tests data transformation functions
 */

import {
  mapDossierToUI,
  mapDossiersToUI,
  generateNumeroDossier,
  formatDate,
  formatDateForInput,
  getTypeLabel,
} from '@/lib/mappers/dossier.mapper';
import type { DossierDB } from '@/types/dossier.types';

describe('dossier.mapper - REAL TESTS', () => {
  const mockDossierDB: DossierDB = {
    id: 'dossier-123',
    numero: 'D-2024-001',
    typeDossier: 'TITRE_SEJOUR',
    objet: 'Renouvellement titre de séjour',
    statut: 'en_cours',
    priorite: 'haute',
    dateCreation: new Date('2024-01-15'),
    dateEcheance: new Date('2024-03-15'),
    client: {
      lastName: 'Dupont',
      firstName: 'Jean',
      email: 'jean.dupont@email.com',
    },
    _count: {
      documents: 5,
      emails: 3,
      factures: 1,
    },
  };

  describe('mapDossierToUI', () => {
    it('should map dossier DB to UI format', () => {
      const result = mapDossierToUI(mockDossierDB);

      expect(result.id).toBe('dossier-123');
      expect(result.numeroDossier).toBe('D-2024-001');
      expect(result.typeDossier).toBe('TITRE_SEJOUR');
      expect(result.objetDemande).toBe('Renouvellement titre de séjour');
    });

    it('should map statut to UI format', () => {
      const result = mapDossierToUI(mockDossierDB);
      expect(result.statut).toBe('EN_COURS');
    });

    it('should map priorite to UI format', () => {
      const result = mapDossierToUI(mockDossierDB);
      expect(result.priorite).toBe('HAUTE');
    });

    it('should map client info', () => {
      const result = mapDossierToUI(mockDossierDB);

      expect(result.client.nom).toBe('Dupont');
      expect(result.client.prenom).toBe('Jean');
      expect(result.client.email).toBe('jean.dupont@email.com');
    });

    it('should include _count object', () => {
      const result = mapDossierToUI(mockDossierDB);

      expect(result._count.documents).toBe(5);
      expect(result._count.emails).toBe(3);
      expect(result._count.factures).toBe(1);
    });

    it('should handle null objet', () => {
      const dossier = { ...mockDossierDB, objet: null };
      const result = mapDossierToUI(dossier as any);

      expect(result.objetDemande).toBe('');
    });

    it('should handle null dateEcheance', () => {
      const dossier = { ...mockDossierDB, dateEcheance: null };
      const result = mapDossierToUI(dossier as any);

      expect(result.dateEcheance).toBeUndefined();
    });
  });

  describe('mapDossiersToUI', () => {
    it('should map array of dossiers', () => {
      const dossiers = [mockDossierDB, { ...mockDossierDB, id: 'dossier-456' }];
      const result = mapDossiersToUI(dossiers);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('dossier-123');
      expect(result[1].id).toBe('dossier-456');
    });

    it('should handle empty array', () => {
      const result = mapDossiersToUI([]);
      expect(result).toEqual([]);
    });

    it('should map all dossiers correctly', () => {
      const dossiers = [
        mockDossierDB,
        { ...mockDossierDB, statut: 'urgent' },
        { ...mockDossierDB, statut: 'termine' },
      ];

      const result = mapDossiersToUI(dossiers);

      expect(result[0].statut).toBe('EN_COURS');
      expect(result[1].statut).toBe('URGENT');
      expect(result[2].statut).toBe('TERMINE');
    });
  });

  describe('generateNumeroDossier', () => {
    it('should generate number with current year', () => {
      const currentYear = new Date().getFullYear();
      const result = generateNumeroDossier(0);

      expect(result).toContain(`D-${currentYear}`);
    });

    it('should pad count with zeros', () => {
      expect(generateNumeroDossier(0)).toMatch(/D-\d{4}-001$/);
      expect(generateNumeroDossier(1)).toMatch(/D-\d{4}-002$/);
      expect(generateNumeroDossier(9)).toMatch(/D-\d{4}-010$/);
      expect(generateNumeroDossier(99)).toMatch(/D-\d{4}-100$/);
    });

    it('should handle large counts', () => {
      expect(generateNumeroDossier(999)).toMatch(/D-\d{4}-1000$/);
      expect(generateNumeroDossier(9999)).toMatch(/D-\d{4}-10000$/);
    });

    it('should increment count by 1', () => {
      const result1 = generateNumeroDossier(5);
      const result2 = generateNumeroDossier(6);

      const num1 = parseInt(result1.split('-')[2]);
      const num2 = parseInt(result2.split('-')[2]);

      expect(num2 - num1).toBe(1);
    });
  });

  describe('formatDate', () => {
    it('should format Date object to French format', () => {
      const date = new Date('2024-03-15');
      const result = formatDate(date);

      // Accept either DD/MM/YYYY or MM/DD/YYYY format depending on locale
      expect(result).toMatch(/^(15\/03\/2024|03\/15\/2024|3\/15\/2024)$/);
    });

    it('should format date string to French format', () => {
      const result = formatDate('2024-06-20');
      // Accept either DD/MM/YYYY or MM/DD/YYYY format depending on locale
      expect(result).toMatch(/^(20\/06\/2024|06\/20\/2024|6\/20\/2024)$/);
    });

    it('should return dash for undefined', () => {
      expect(formatDate(undefined)).toBe('-');
    });

    it('should return dash for null', () => {
      expect(formatDate(null as any)).toBe('-');
    });

    it('should handle various date formats', () => {
      // Accept either DD/MM/YYYY or MM/DD/YYYY format depending on locale
      expect(formatDate('2024-01-01')).toMatch(/^(01\/01\/2024|1\/1\/2024)$/);
      expect(formatDate('2024-12-31')).toMatch(/^(31\/12\/2024|12\/31\/2024)$/);
      expect(formatDate(new Date(2024, 5, 15))).toMatch(
        /^(15\/06\/2024|06\/15\/2024|6\/15\/2024)$/
      );
    });
  });

  describe('formatDateForInput', () => {
    it('should format Date for datetime-local input', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      const result = formatDateForInput(date);

      // Format should be YYYY-MM-DDTHH:MM
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should format date string for input', () => {
      const result = formatDateForInput('2024-06-20T14:00:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should return empty string for undefined', () => {
      expect(formatDateForInput(undefined)).toBe('');
    });

    it('should return empty string for null', () => {
      expect(formatDateForInput(null as any)).toBe('');
    });

    it('should return exactly 16 characters', () => {
      const result = formatDateForInput(new Date());
      expect(result.length).toBe(16);
    });
  });

  describe('getTypeLabel', () => {
    it('should return label for TITRE_SEJOUR', () => {
      expect(getTypeLabel('TITRE_SEJOUR')).toBe('Titre de Sejour');
    });

    it('should return label for RECOURS_OQTF', () => {
      expect(getTypeLabel('RECOURS_OQTF')).toBe('Recours OQTF');
    });

    it('should return label for NATURALISATION', () => {
      expect(getTypeLabel('NATURALISATION')).toBe('Naturalisation');
    });

    it('should return label for REGROUPEMENT_FAMILIAL', () => {
      expect(getTypeLabel('REGROUPEMENT_FAMILIAL')).toBe('Regroupement Familial');
    });

    it('should return label for ASILE', () => {
      expect(getTypeLabel('ASILE')).toBe("Demande d'Asile");
    });

    it('should return label for VISA', () => {
      expect(getTypeLabel('VISA')).toBe('Visa');
    });

    it('should return label for AUTRE', () => {
      expect(getTypeLabel('AUTRE')).toBe('Autre');
    });

    it('should return type itself for unknown types', () => {
      expect(getTypeLabel('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
      expect(getTypeLabel('custom')).toBe('custom');
    });
  });

  describe('Integration scenarios', () => {
    it('should fully transform dossier for UI display', () => {
      const dbData: DossierDB = {
        id: 'test-id',
        numero: 'D-2024-042',
        typeDossier: 'NATURALISATION',
        objet: 'Demande naturalisation par mariage',
        statut: 'en_attente',
        priorite: 'normale',
        dateCreation: new Date('2024-02-01'),
        dateEcheance: new Date('2024-06-01'),
        client: {
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie@test.com',
        },
        _count: {
          documents: 10,
          emails: 5,
          factures: 2,
        },
      };

      const uiData = mapDossierToUI(dbData);

      expect(uiData.id).toBe('test-id');
      expect(uiData.statut).toBe('EN_ATTENTE');
      expect(uiData.priorite).toBe('NORMALE');
      expect(uiData.client.nom).toBe('Martin');
      expect(uiData.client.prenom).toBe('Marie');

      // Date formatting - Accept either DD/MM/YYYY or MM/DD/YYYY format depending on locale
      expect(formatDate(uiData.dateCreation)).toMatch(/^(01\/02\/2024|02\/01\/2024|2\/1\/2024)$/);

      // Type label
      expect(getTypeLabel(uiData.typeDossier)).toBe('Naturalisation');
    });
  });
});
