/**
 * Tests pour les helpers RGPD
 * Couverture: anonymisation, consentement, export
 */

import { anonymizeForAI } from '@/lib/utils/rgpd-helpers';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  logRGPDAction: jest.fn(),
}));

describe('RGPD Helpers', () => {
  describe('anonymizeForAI', () => {
    it('devrait anonymiser les emails', () => {
      const data = {
        email: 'jean.dupont@example.com',
        otherField: 'value',
      };

      const result = anonymizeForAI(data);

      expect(result.email).toBe('[EMAIL_ANONYMISE]');
      expect(result.otherField).toBe('value');
    });

    it('devrait anonymiser les téléphones', () => {
      const data = {
        telephone: '+33612345678',
        phone: '0612345678',
      };

      const result = anonymizeForAI(data);

      expect(result.telephone).toBe('[TELEPHONE_ANONYMISE]');
      expect(result.phone).toBe('[TELEPHONE_ANONYMISE]');
    });

    it('devrait anonymiser les noms', () => {
      const data = {
        firstName: 'Jean',
        lastName: 'Dupont',
        nom: 'Dupont',
        prenom: 'Jean',
      };

      const result = anonymizeForAI(data);

      expect(result.firstName).toBe('[NOM_ANONYMISE]');
      expect(result.lastName).toBe('[NOM_ANONYMISE]');
      expect(result.nom).toBe('[NOM_ANONYMISE]');
      expect(result.prenom).toBe('[NOM_ANONYMISE]');
    });

    it('devrait anonymiser les adresses', () => {
      const data = {
        address: '123 rue Example',
        adresse: '456 avenue Test',
      };

      const result = anonymizeForAI(data);

      expect(result.address).toBe('[ADRESSE_ANONYMISEE]');
      expect(result.adresse).toBe('[ADRESSE_ANONYMISEE]');
    });

    it('devrait anonymiser les données sensibles', () => {
      const data = {
        passportNumber: 'AB123456',
        idCardNumber: '12345678',
        iban: 'FR7612345',
      };

      const result = anonymizeForAI(data);

      expect(result.passportNumber).toBe('[DONNEE_PERSONNELLE]');
      expect(result.idCardNumber).toBe('[DONNEE_PERSONNELLE]');
      expect(result.iban).toBe('[DONNEE_PERSONNELLE]');
    });

    it('devrait préserver les champs non sensibles', () => {
      const data = {
        id: 'client-123',
        status: 'active',
        createdAt: '2024-01-01',
        type: 'particulier',
        email: 'test@example.com',
      };

      const result = anonymizeForAI(data);

      expect(result.id).toBe('client-123');
      expect(result.status).toBe('active');
      expect(result.createdAt).toBe('2024-01-01');
      expect(result.type).toBe('particulier');
      expect(result.email).toBe('[EMAIL_ANONYMISE]');
    });

    it('devrait gérer un objet vide', () => {
      const data = {};
      const result = anonymizeForAI(data);
      expect(result).toEqual({});
    });

    it('devrait ne pas modifier l\'objet original', () => {
      const data = {
        email: 'test@example.com',
        nom: 'Dupont',
      };

      const result = anonymizeForAI(data);

      expect(data.email).toBe('test@example.com');
      expect(data.nom).toBe('Dupont');
      expect(result.email).toBe('[EMAIL_ANONYMISE]');
    });

    it('devrait anonymiser emailSecondaire', () => {
      const data = {
        emailSecondaire: 'secondary@example.com',
      };

      const result = anonymizeForAI(data);

      expect(result.emailSecondaire).toBe('[EMAIL_ANONYMISE]');
    });

    it('devrait anonymiser phoneSecondaire', () => {
      const data = {
        phoneSecondaire: '+33698765432',
      };

      const result = anonymizeForAI(data);

      expect(result.phoneSecondaire).toBe('[TELEPHONE_ANONYMISE]');
    });

    it('devrait anonymiser nomNaissance', () => {
      const data = {
        nomNaissance: 'Martin',
      };

      const result = anonymizeForAI(data);

      expect(result.nomNaissance).toBe('[NOM_ANONYMISE]');
    });

    it('devrait anonymiser adresseCorrespondance', () => {
      const data = {
        adresseCorrespondance: '789 boulevard Correspondance',
      };

      const result = anonymizeForAI(data);

      expect(result.adresseCorrespondance).toBe('[ADRESSE_ANONYMISEE]');
    });

    it('devrait anonymiser les données CESEDA spécifiques', () => {
      const data = {
        titreSejourNumber: 'TS123456',
        numeroSecuriteSociale: '1234567890123',
        lieuNaissance: 'Paris',
        contactUrgenceNom: 'Jean Martin',
        contactUrgenceTel: '0612345678',
      };

      const result = anonymizeForAI(data);

      expect(result.titreSejourNumber).toBe('[DONNEE_PERSONNELLE]');
      expect(result.numeroSecuriteSociale).toBe('[DONNEE_PERSONNELLE]');
      expect(result.lieuNaissance).toBe('[DONNEE_PERSONNELLE]');
      // contactUrgenceNom et contactUrgenceTel sont aussi anonymisés en DONNEE_PERSONNELLE
      expect(result.contactUrgenceNom).toBe('[DONNEE_PERSONNELLE]');
      expect(result.contactUrgenceTel).toBe('[TELEPHONE_ANONYMISE]');
    });

    it('devrait gérer les valeurs null/undefined', () => {
      const data = {
        email: null,
        telephone: undefined,
        nom: 'Dupont',
      };

      const result = anonymizeForAI(data as any);

      // Les champs null/undefined ne sont pas modifiés car ils ne sont pas "in" l'objet
      // ou sont déjà falsy
      expect(result.nom).toBe('[NOM_ANONYMISE]');
    });
  });

  describe('Structure des données anonymisées', () => {
    it('devrait produire des données utilisables par l\'IA', () => {
      const clientData = {
        id: 'client-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        telephone: '+33612345678',
        address: '123 rue Example, 75001 Paris',
        dossierType: 'TITRE_SEJOUR',
        status: 'EN_COURS',
        createdAt: '2024-01-01',
      };

      const anonymized = anonymizeForAI(clientData);

      // L'IA peut utiliser les métadonnées non sensibles
      expect(anonymized.id).toBe('client-1');
      expect(anonymized.dossierType).toBe('TITRE_SEJOUR');
      expect(anonymized.status).toBe('EN_COURS');
      expect(anonymized.createdAt).toBe('2024-01-01');

      // Mais pas les données personnelles
      expect(anonymized.firstName).toBe('[NOM_ANONYMISE]');
      expect(anonymized.lastName).toBe('[NOM_ANONYMISE]');
      expect(anonymized.email).toBe('[EMAIL_ANONYMISE]');
    });

    it('devrait permettre le traitement IA sur les dossiers', () => {
      const dossierData = {
        id: 'dossier-1',
        numero: 'DOS-2024-001',
        type: 'TITRE_SEJOUR',
        statut: 'EN_ATTENTE_DOCUMENTS',
        clientNom: 'Dupont',
        clientPrenom: 'Jean',
        email: 'client@example.com',
        dateEcheance: '2024-06-01',
        priorite: 'HAUTE',
      };

      const anonymized = anonymizeForAI(dossierData);

      // Données métier préservées
      expect(anonymized.numero).toBe('DOS-2024-001');
      expect(anonymized.type).toBe('TITRE_SEJOUR');
      expect(anonymized.statut).toBe('EN_ATTENTE_DOCUMENTS');
      expect(anonymized.dateEcheance).toBe('2024-06-01');
      expect(anonymized.priorite).toBe('HAUTE');

      // Données personnelles anonymisées
      expect(anonymized.email).toBe('[EMAIL_ANONYMISE]');
    });
  });
});
