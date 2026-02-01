/**
 * Tests pour dossier.validation.ts - Schémas Zod v2
 * Tests des schémas de validation et helper functions
 */

import {
  dossierBaseSchema,
  createDossierSchema,
  createDemandeClientSchema,
  updateDossierSchema,
  validateDossierData,
} from '@/lib/validations/dossier.validation';
import { TYPES_DOSSIER, PRIORITES_UI, STATUTS_UI } from '@/lib/constants/dossier.constants';

describe('dossier.validation - Schémas Zod v2', () => {
  
  // ============================================
  // dossierBaseSchema
  // ============================================
  describe('dossierBaseSchema', () => {
    const validBaseData = {
      typeDossier: TYPES_DOSSIER.TITRE_SEJOUR,
      objetDemande: 'Demande de renouvellement de titre de séjour pour travail',
      priorite: PRIORITES_UI.NORMALE,
    };

    test('accepte des données valides minimales', () => {
      const result = dossierBaseSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });

    test('accepte tous les types de dossier', () => {
      const types = Object.values(TYPES_DOSSIER);
      types.forEach(type => {
        const result = dossierBaseSchema.safeParse({
          ...validBaseData,
          typeDossier: type,
        });
        expect(result.success).toBe(true);
      });
    });

    test('accepte toutes les priorités', () => {
      const priorites = Object.values(PRIORITES_UI);
      priorites.forEach(priorite => {
        const result = dossierBaseSchema.safeParse({
          ...validBaseData,
          priorite,
        });
        expect(result.success).toBe(true);
      });
    });

    test('rejette un typeDossier invalide', () => {
      const result = dossierBaseSchema.safeParse({
        ...validBaseData,
        typeDossier: 'TYPE_INVALIDE',
      });
      expect(result.success).toBe(false);
    });

    test('rejette un objetDemande trop court (< 10 caractères)', () => {
      const result = dossierBaseSchema.safeParse({
        ...validBaseData,
        objetDemande: 'Court',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('10');
      }
    });

    test('rejette un objetDemande trop long (> 500 caractères)', () => {
      const result = dossierBaseSchema.safeParse({
        ...validBaseData,
        objetDemande: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    test('accepte des notes optionnelles', () => {
      const result = dossierBaseSchema.safeParse({
        ...validBaseData,
        notes: 'Notes supplémentaires sur le dossier',
      });
      expect(result.success).toBe(true);
    });

    test('rejette des notes trop longues (> 2000 caractères)', () => {
      const result = dossierBaseSchema.safeParse({
        ...validBaseData,
        notes: 'A'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    test('accepte une dateEcheance valide', () => {
      const result = dossierBaseSchema.safeParse({
        ...validBaseData,
        dateEcheance: '2026-03-15T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    test('accepte une dateEcheance vide', () => {
      const result = dossierBaseSchema.safeParse({
        ...validBaseData,
        dateEcheance: '',
      });
      expect(result.success).toBe(true);
    });

    test('utilise la priorité normale par défaut', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: TYPES_DOSSIER.TITRE_SEJOUR,
        objetDemande: 'Demande valide avec plus de 10 caractères',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priorite).toBe(PRIORITES_UI.NORMALE);
      }
    });
  });

  // ============================================
  // createDossierSchema
  // ============================================
  describe('createDossierSchema', () => {
    const validCreateData = {
      typeDossier: TYPES_DOSSIER.RECOURS_OQTF,
      objetDemande: 'Recours contre obligation de quitter le territoire',
      priorite: PRIORITES_UI.URGENTE,
      clientId: '550e8400-e29b-41d4-a716-446655440000',
    };

    test('accepte des données de création valides', () => {
      const result = createDossierSchema.safeParse(validCreateData);
      expect(result.success).toBe(true);
    });

    test('requiert un clientId UUID valide', () => {
      const result = createDossierSchema.safeParse({
        ...validCreateData,
        clientId: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('invalide');
      }
    });

    test('rejette sans clientId', () => {
      const { clientId, ...dataWithoutClientId } = validCreateData;
      const result = createDossierSchema.safeParse(dataWithoutClientId);
      expect(result.success).toBe(false);
    });

    test('accepte un statut optionnel valide', () => {
      const validStatuts = [
        STATUTS_UI.BROUILLON,
        STATUTS_UI.EN_COURS,
        STATUTS_UI.EN_ATTENTE,
        STATUTS_UI.URGENT,
      ];
      validStatuts.forEach(statut => {
        const result = createDossierSchema.safeParse({
          ...validCreateData,
          statut,
        });
        expect(result.success).toBe(true);
      });
    });

    test('rejette un statut non autorisé à la création', () => {
      const result = createDossierSchema.safeParse({
        ...validCreateData,
        statut: STATUTS_UI.TERMINE,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // createDemandeClientSchema
  // ============================================
  describe('createDemandeClientSchema', () => {
    const validDemandeData = {
      typeDossier: TYPES_DOSSIER.NATURALISATION,
      objetDemande: 'Je souhaite demander ma naturalisation française après 5 ans de résidence',
    };

    test('accepte une demande client valide', () => {
      const result = createDemandeClientSchema.safeParse(validDemandeData);
      expect(result.success).toBe(true);
    });

    test('requiert minimum 20 caractères pour objetDemande', () => {
      const result = createDemandeClientSchema.safeParse({
        ...validDemandeData,
        objetDemande: 'Trop court',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('20');
      }
    });

    test('accepte une urgence booléenne', () => {
      const result = createDemandeClientSchema.safeParse({
        ...validDemandeData,
        urgence: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgence).toBe(true);
      }
    });

    test('accepte un complément d\'information', () => {
      const result = createDemandeClientSchema.safeParse({
        ...validDemandeData,
        complementInfo: 'Informations complémentaires sur ma situation',
      });
      expect(result.success).toBe(true);
    });

    test('rejette un complementInfo trop long (> 1000 caractères)', () => {
      const result = createDemandeClientSchema.safeParse({
        ...validDemandeData,
        complementInfo: 'A'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    test('accepte tous les types de dossier', () => {
      Object.values(TYPES_DOSSIER).forEach(type => {
        const result = createDemandeClientSchema.safeParse({
          ...validDemandeData,
          typeDossier: type,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================
  // updateDossierSchema
  // ============================================
  describe('updateDossierSchema', () => {
    test('accepte une mise à jour partielle (typeDossier seul)', () => {
      const result = updateDossierSchema.safeParse({
        typeDossier: TYPES_DOSSIER.ASILE,
      });
      expect(result.success).toBe(true);
    });

    test('accepte une mise à jour vide', () => {
      const result = updateDossierSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    test('accepte tous les statuts pour mise à jour', () => {
      const allStatuts = Object.values(STATUTS_UI);
      allStatuts.forEach(statut => {
        const result = updateDossierSchema.safeParse({ statut });
        expect(result.success).toBe(true);
      });
    });

    test('accepte le statut TERMINE', () => {
      const result = updateDossierSchema.safeParse({
        statut: STATUTS_UI.TERMINE,
      });
      expect(result.success).toBe(true);
    });

    test('accepte le statut REJETE', () => {
      const result = updateDossierSchema.safeParse({
        statut: STATUTS_UI.REJETE,
      });
      expect(result.success).toBe(true);
    });

    test('accepte le statut ANNULE', () => {
      const result = updateDossierSchema.safeParse({
        statut: STATUTS_UI.ANNULE,
      });
      expect(result.success).toBe(true);
    });

    test('accepte une mise à jour de priorité', () => {
      const result = updateDossierSchema.safeParse({
        priorite: PRIORITES_UI.CRITIQUE,
      });
      expect(result.success).toBe(true);
    });

    test('rejette un objetDemande invalide même en mise à jour', () => {
      const result = updateDossierSchema.safeParse({
        objetDemande: 'Court',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // validateDossierData helper
  // ============================================
  describe('validateDossierData', () => {
    test('retourne success:true avec data validées', () => {
      const data = {
        typeDossier: TYPES_DOSSIER.VISA,
        objetDemande: 'Demande de visa pour regroupement familial',
        priorite: PRIORITES_UI.HAUTE,
        clientId: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      const result = validateDossierData(createDossierSchema, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    test('retourne success:false avec errors pour données invalides', () => {
      const invalidData = {
        typeDossier: 'INVALID',
        objetDemande: 'Short',
      };
      
      const result = validateDossierData(dossierBaseSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors.errors.length).toBeGreaterThan(0);
      }
    });

    test('propage les erreurs non-Zod', () => {
      const brokenSchema = {
        parse: () => { throw new Error('Unexpected error'); },
      } as any;
      
      expect(() => validateDossierData(brokenSchema, {})).toThrow('Unexpected error');
    });

    test('fonctionne avec updateDossierSchema', () => {
      const result = validateDossierData(updateDossierSchema, {
        statut: STATUTS_UI.EN_COURS,
      });
      expect(result.success).toBe(true);
    });

    test('fonctionne avec createDemandeClientSchema', () => {
      const result = validateDossierData(createDemandeClientSchema, {
        typeDossier: TYPES_DOSSIER.REGROUPEMENT_FAMILIAL,
        objetDemande: 'Je souhaite faire venir ma famille en France après obtention de mon CDI',
      });
      expect(result.success).toBe(true);
    });
  });
});
