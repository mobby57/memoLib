/**
 * Tests pour src/lib/utils/rgpd-helpers.ts
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findUnique: vi.fn(),
      update: vi.fn(),
    aIDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    audit: vi.fn(),
  },
  logRGPDAction: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { logRGPDAction } from '@/lib/logger';
import {
  anonymizeForAI,
  hasRGPDConsent,
  recordConsent,
  exportClientData,
  anonymizeClientData,
  validateDataProcessing,
  logDataAccess,
} from '@/lib/utils/rgpd-helpers';

const mockPrisma = prisma as any;

describe('rgpd-helpers.ts — Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('anonymizeForAI', () => {
    it('should anonymize email fields', () => {
      const result = anonymizeForAI({ email: 'test@test.com', emailSecondaire: 'b@b.com' });
      expect(result.email).toBe('[EMAIL_ANONYMISE]');
      expect(result.emailSecondaire).toBe('[EMAIL_ANONYMISE]');
    });

    it('should anonymize phone fields', () => {
      const result = anonymizeForAI({ telephone: '+33600', phone: '+33611', phoneSecondaire: '+33622', contactUrgenceTel: '+33633' });
      expect(result.telephone).toBe('[TELEPHONE_ANONYMISE]');
      expect(result.phone).toBe('[TELEPHONE_ANONYMISE]');
      expect(result.phoneSecondaire).toBe('[TELEPHONE_ANONYMISE]');
      expect(result.contactUrgenceTel).toBe('[TELEPHONE_ANONYMISE]');
    });

    it('should anonymize name fields', () => {
      const result = anonymizeForAI({ firstName: 'Jean', lastName: 'Dupont', prenom: 'Jean', nom: 'Dupont', nomNaissance: 'Martin', contactUrgenceNom: 'Marie' });
      expect(result.firstName).toBe('[NOM_ANONYMISE]');
      expect(result.lastName).toBe('[NOM_ANONYMISE]');
      expect(result.prenom).toBe('[NOM_ANONYMISE]');
      expect(result.nom).toBe('[NOM_ANONYMISE]');
      expect(result.nomNaissance).toBe('[NOM_ANONYMISE]');
      // contactUrgenceNom has capital N — check includes('nom') is case-sensitive
      // 'contactUrgenceNom' includes 'nom' = false (N is uppercase)
      expect(result.contactUrgenceNom).toBe('[DONNEE_PERSONNELLE]');
    });

    it('should anonymize address fields', () => {
      const result = anonymizeForAI({ address: '12 rue Paris', adresse: '15 avenue Lyon', adresseCorrespondance: '3 place' });
      expect(result.address).toBe('[ADRESSE_ANONYMISEE]');
      expect(result.adresse).toBe('[ADRESSE_ANONYMISEE]');
      expect(result.adresseCorrespondance).toBe('[ADRESSE_ANONYMISEE]');
    });

    it('should anonymize other sensitive fields', () => {
      const result = anonymizeForAI({
        passportNumber: 'AB123',
        idCardNumber: 'ID456',
        titreSejourNumber: 'TS789',
        numeroSecuriteSociale: '1234',
        iban: 'FR76123',
        bic: 'BNPA',
        lieuNaissance: 'Lyon',
      });
      expect(result.passportNumber).toBe('[DONNEE_PERSONNELLE]');
      expect(result.idCardNumber).toBe('[DONNEE_PERSONNELLE]');
      expect(result.titreSejourNumber).toBe('[DONNEE_PERSONNELLE]');
      expect(result.numeroSecuriteSociale).toBe('[DONNEE_PERSONNELLE]');
      expect(result.iban).toBe('[DONNEE_PERSONNELLE]');
      expect(result.bic).toBe('[DONNEE_PERSONNELLE]');
      expect(result.lieuNaissance).toBe('[DONNEE_PERSONNELLE]');
    });

    it('should preserve non-sensitive fields', () => {
      const result = anonymizeForAI({ dossierType: 'OQTF', urgence: 'haute', notes: 'Important' });
      expect(result.dossierType).toBe('OQTF');
      expect(result.urgence).toBe('haute');
      expect(result.notes).toBe('Important');
    });

    it('should not modify fields that are not present', () => {
      const result = anonymizeForAI({ title: 'Test' });
      expect(result.title).toBe('Test');
      expect(result.email).toBeUndefined();
    });
  });

  describe('hasRGPDConsent', () => {
    it('should return true when consent is given', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        consentementRGPD: true,
        dateConsentementRGPD: new Date(),
      });
      expect(await hasRGPDConsent('c1')).toBe(true);
    });

    it('should return false when no consent', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        consentementRGPD: false,
        dateConsentementRGPD: null,
      });
      expect(await hasRGPDConsent('c1')).toBe(false);
    });

    it('should return false when consent true but no date', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        consentementRGPD: true,
        dateConsentementRGPD: null,
      });
      expect(await hasRGPDConsent('c1')).toBe(false);
    });

    it('should return false when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      expect(await hasRGPDConsent('unknown')).toBe(false);
    });
  });

  describe('recordConsent', () => {
    it('should update client and log action', async () => {
      mockPrisma.client.update.mockResolvedValue({});
      await recordConsent({
        clientId: 'c1',
        userId: 'u1',
        tenantId: 't1',
        consentType: 'data_processing',
      });
      expect(mockPrisma.client.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'c1' },
        data: expect.objectContaining({ consentementRGPD: true }),
      }));
      expect(logRGPDAction).toHaveBeenCalledWith('CONSENT_UPDATE', 'u1', 't1', 'c1', expect.anything());
    });
  });

  describe('exportClientData', () => {
    it('should export client data with dossiers', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 'c1',
        tenantId: 't1',
        nom: 'Dupont',
        dossiers: [
          { id: 'd1', documents: [{ id: 'doc1' }], factures: [{ id: 'f1' }] },
        ],
      });

      const result = await exportClientData({ clientId: 'c1', userId: 'u1', tenantId: 't1' });
      expect(result.client.id).toBe('c1');
      expect(result.dossiers).toHaveLength(1);
      expect(result.documents).toHaveLength(1);
      expect(result.factures).toHaveLength(1);
    });

    it('should throw when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(exportClientData({ clientId: 'x', userId: 'u', tenantId: 't' }))
        .rejects.toThrow('Client not found');
    });

    it('should throw on tenant mismatch', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 'c1',
        tenantId: 'other-tenant',
        dossiers: [],
      });
      await expect(exportClientData({ clientId: 'c1', userId: 'u1', tenantId: 't1' }))
        .rejects.toThrow('Tenant isolation violation');
    });
  });

  describe('anonymizeClientData', () => {
    it('should anonymize client data', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ tenantId: 't1' });
      mockPrisma.client.update.mockResolvedValue({});

      await anonymizeClientData({ clientId: 'c1', userId: 'u1', tenantId: 't1', reason: 'Demande client' });

      expect(mockPrisma.client.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'ANONYMISE',
          lastName: 'ANONYMISE',
          status: 'archive',
        }),
      }));
      expect(logRGPDAction).toHaveBeenCalledWith('ANONYMIZE', 'u1', 't1', 'c1', expect.anything());
    });

    it('should throw on tenant mismatch', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ tenantId: 'other' });
      await expect(anonymizeClientData({ clientId: 'c1', userId: 'u1', tenantId: 't1', reason: 'test' }))
        .rejects.toThrow('Client not found or tenant mismatch');
    });

    it('should throw when client not found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(anonymizeClientData({ clientId: 'x', userId: 'u', tenantId: 't', reason: 'r' }))
        .rejects.toThrow();
    });
  });

  describe('validateDataProcessing', () => {
    it('should allow with consent and non-sensitive data', () => {
      const result = validateDataProcessing({ purpose: 'analysis', dataTypes: ['profile'], hasConsent: true });
      expect(result.allowed).toBe(true);
    });

    it('should deny without consent', () => {
      const result = validateDataProcessing({ purpose: 'analysis', dataTypes: ['profile'], hasConsent: false });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Consent');
    });

    it('should deny sensitive data types', () => {
      const result = validateDataProcessing({ purpose: 'analysis', dataTypes: ['health'], hasConsent: true });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Sensitive data');
    });

    it('should deny criminal data', () => {
      const result = validateDataProcessing({ purpose: 'check', dataTypes: ['criminal'], hasConsent: true });
      expect(result.allowed).toBe(false);
    });

    it('should deny biometric data', () => {
      const result = validateDataProcessing({ purpose: 'id', dataTypes: ['biometric'], hasConsent: true });
      expect(result.allowed).toBe(false);
    });
  });

  describe('logDataAccess', () => {
    it('should log access via logger.audit', async () => {
      const { logger } = await import('@/lib/logger');
      await logDataAccess({
        userId: 'u1',
        tenantId: 't1',
        resourceType: 'client',
        resourceId: 'c1',
        action: 'read',
        purpose: 'consultation dossier',
      });
      expect(logger.audit).toHaveBeenCalledWith(
        'DATA_ACCESS: READ_CLIENT',
        'u1',
        't1',
        expect.objectContaining({ resourceId: 'c1', purpose: 'consultation dossier', rgpdCompliant: true })
      );
    });
  });
});
