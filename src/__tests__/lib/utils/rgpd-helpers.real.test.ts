/**
 * Real tests for rgpd-helpers.ts to increase actual coverage
 * Tests pure functions without Prisma dependencies
 */

import {
  anonymizeForAI,
  validateDataProcessing,
} from '@/lib/utils/rgpd-helpers'

describe('rgpd-helpers - REAL TESTS', () => {
  describe('anonymizeForAI', () => {
    it('should anonymize firstName and lastName', () => {
      const data = {
        firstName: 'Jean',
        lastName: 'Dupont',
        status: 'active',
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.firstName).toBe('[NOM_ANONYMISE]')
      expect(result.lastName).toBe('[NOM_ANONYMISE]')
      expect(result.status).toBe('active')
    })

    it('should anonymize prenom and nom', () => {
      const data = {
        prenom: 'Marie',
        nom: 'Martin',
        id: '123',
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.prenom).toBe('[NOM_ANONYMISE]')
      expect(result.nom).toBe('[NOM_ANONYMISE]')
      expect(result.id).toBe('123')
    })

    it('should anonymize email fields', () => {
      const data = {
        email: 'user@example.com',
        emailSecondaire: 'secondary@test.com',
        type: 'client',
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.email).toBe('[EMAIL_ANONYMISE]')
      expect(result.emailSecondaire).toBe('[EMAIL_ANONYMISE]')
      expect(result.type).toBe('client')
    })

    it('should anonymize phone fields', () => {
      const data = {
        telephone: '0612345678',
        phone: '+33612345678',
        phoneSecondaire: '0698765432',
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.telephone).toBe('[TELEPHONE_ANONYMISE]')
      expect(result.phone).toBe('[TELEPHONE_ANONYMISE]')
      expect(result.phoneSecondaire).toBe('[TELEPHONE_ANONYMISE]')
    })

    it('should anonymize address fields', () => {
      const data = {
        address: '123 Rue de Paris',
        adresse: '456 Avenue de Lyon',
        adresseCorrespondance: '789 Boulevard Marseille',
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.address).toBe('[ADRESSE_ANONYMISEE]')
      expect(result.adresse).toBe('[ADRESSE_ANONYMISEE]')
      expect(result.adresseCorrespondance).toBe('[ADRESSE_ANONYMISEE]')
    })

    it('should anonymize identification numbers', () => {
      const data = {
        passportNumber: 'AB123456',
        idCardNumber: '987654321',
        titreSejourNumber: 'TS789012',
        numeroSecuriteSociale: '1234567890123',
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.passportNumber).toBe('[DONNEE_PERSONNELLE]')
      expect(result.idCardNumber).toBe('[DONNEE_PERSONNELLE]')
      expect(result.titreSejourNumber).toBe('[DONNEE_PERSONNELLE]')
      expect(result.numeroSecuriteSociale).toBe('[DONNEE_PERSONNELLE]')
    })

    it('should anonymize financial data', () => {
      const data = {
        iban: 'FR7612345678901234567890123',
        bic: 'BNPAFRPP',
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.iban).toBe('[DONNEE_PERSONNELLE]')
      expect(result.bic).toBe('[DONNEE_PERSONNELLE]')
    })

    it('should anonymize emergency contact info', () => {
      const data = {
        contactUrgenceNom: 'Marie Dupont',
        contactUrgenceTel: '0612345678',
        lieuNaissance: 'Paris',
      }
      
      const result = anonymizeForAI(data)
      
      // contactUrgenceNom doesn't contain 'nom' as a word match, so it's [DONNEE_PERSONNELLE]
      expect(result.contactUrgenceNom).toBe('[DONNEE_PERSONNELLE]')
      expect(result.contactUrgenceTel).toBe('[TELEPHONE_ANONYMISE]')
      expect(result.lieuNaissance).toBe('[DONNEE_PERSONNELLE]')
    })

    it('should not modify non-sensitive fields', () => {
      const data = {
        id: 'uuid-123',
        status: 'active',
        createdAt: '2024-01-01',
        nationality: 'French', // This is sensitive and should be kept
        dossierType: 'visa',
        notes: 'Some notes',
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.id).toBe('uuid-123')
      expect(result.status).toBe('active')
      expect(result.createdAt).toBe('2024-01-01')
      expect(result.dossierType).toBe('visa')
      expect(result.notes).toBe('Some notes')
    })

    it('should preserve the original object structure', () => {
      const data = {
        firstName: 'Test',
        nested: { value: 123 },
        array: [1, 2, 3],
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.firstName).toBe('[NOM_ANONYMISE]')
      expect(result.nested).toEqual({ value: 123 })
      expect(result.array).toEqual([1, 2, 3])
    })

    it('should not mutate original object', () => {
      const original = {
        firstName: 'Jean',
        email: 'jean@test.com',
      }
      
      const result = anonymizeForAI(original)
      
      expect(original.firstName).toBe('Jean')
      expect(original.email).toBe('jean@test.com')
      expect(result.firstName).toBe('[NOM_ANONYMISE]')
    })

    it('should handle empty object', () => {
      const data = {}
      const result = anonymizeForAI(data)
      expect(result).toEqual({})
    })

    it('should handle object with no sensitive fields', () => {
      const data = {
        id: '123',
        status: 'pending',
        createdAt: new Date(),
      }
      
      const result = anonymizeForAI(data)
      
      expect(result.id).toBe('123')
      expect(result.status).toBe('pending')
    })

    it('should anonymize nomNaissance', () => {
      const data = {
        nomNaissance: 'Martin-Dupont',
      }
      
      const result = anonymizeForAI(data)
      expect(result.nomNaissance).toBe('[NOM_ANONYMISE]')
    })
  })

  describe('validateDataProcessing', () => {
    it('should allow processing with consent and no sensitive data', () => {
      const result = validateDataProcessing({
        purpose: 'dossier_management',
        dataTypes: ['contact', 'identity'],
        hasConsent: true,
      })
      
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should deny processing without consent', () => {
      const result = validateDataProcessing({
        purpose: 'marketing',
        dataTypes: ['email'],
        hasConsent: false,
      })
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Consent RGPD required')
    })

    it('should deny processing of health data', () => {
      const result = validateDataProcessing({
        purpose: 'medical_assessment',
        dataTypes: ['identity', 'health'],
        hasConsent: true,
      })
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Sensitive data')
    })

    it('should deny processing of criminal data', () => {
      const result = validateDataProcessing({
        purpose: 'background_check',
        dataTypes: ['identity', 'criminal'],
        hasConsent: true,
      })
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Sensitive data')
    })

    it('should deny processing of biometric data', () => {
      const result = validateDataProcessing({
        purpose: 'verification',
        dataTypes: ['biometric', 'photo'],
        hasConsent: true,
      })
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Sensitive data')
    })

    it('should allow processing of non-sensitive data types', () => {
      const nonSensitiveTypes = [
        'contact',
        'address',
        'nationality',
        'employment',
        'education',
      ]
      
      nonSensitiveTypes.forEach(dataType => {
        const result = validateDataProcessing({
          purpose: 'dossier_processing',
          dataTypes: [dataType],
          hasConsent: true,
        })
        
        expect(result.allowed).toBe(true)
      })
    })

    it('should check consent first before sensitive data', () => {
      // Without consent, should fail on consent reason
      const result = validateDataProcessing({
        purpose: 'test',
        dataTypes: ['health'],
        hasConsent: false,
      })
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Consent')
    })

    it('should handle empty data types array', () => {
      const result = validateDataProcessing({
        purpose: 'minimal',
        dataTypes: [],
        hasConsent: true,
      })
      
      expect(result.allowed).toBe(true)
    })

    it('should handle multiple data types with one sensitive', () => {
      const result = validateDataProcessing({
        purpose: 'comprehensive',
        dataTypes: ['identity', 'contact', 'health', 'address'],
        hasConsent: true,
      })
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Sensitive data')
    })
  })

  describe('RGPD Compliance Scenarios', () => {
    it('should protect client data for AI processing', () => {
      const clientData = {
        id: 'client-123',
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@email.com',
        telephone: '0612345678',
        address: '123 Rue de Paris, 75001 Paris',
        nationality: 'French',
        status: 'active',
        dossierType: 'titre_sejour',
      }
      
      const anonymized = anonymizeForAI(clientData)
      
      // Personal data is protected
      expect(anonymized.firstName).not.toBe('Jean')
      expect(anonymized.lastName).not.toBe('Dupont')
      expect(anonymized.email).not.toContain('@')
      expect(anonymized.telephone).not.toMatch(/^\d+$/)
      expect(anonymized.address).not.toContain('Paris')
      
      // Non-personal data preserved
      expect(anonymized.id).toBe('client-123')
      expect(anonymized.status).toBe('active')
      expect(anonymized.dossierType).toBe('titre_sejour')
    })

    it('should validate data processing for various purposes', () => {
      const scenarios = [
        { purpose: 'dossier_creation', dataTypes: ['identity', 'contact'], hasConsent: true, expectAllowed: true },
        { purpose: 'marketing_email', dataTypes: ['email'], hasConsent: false, expectAllowed: false },
        { purpose: 'medical_visa', dataTypes: ['health'], hasConsent: true, expectAllowed: false },
        { purpose: 'document_upload', dataTypes: ['document'], hasConsent: true, expectAllowed: true },
      ]
      
      scenarios.forEach(scenario => {
        const result = validateDataProcessing({
          purpose: scenario.purpose,
          dataTypes: scenario.dataTypes,
          hasConsent: scenario.hasConsent,
        })
        
        expect(result.allowed).toBe(scenario.expectAllowed)
      })
    })
  })
})
