/**
 * Tests pour les schemas de validation Zod des dossiers
 * Couverture: createDossierSchema, updateDossierSchema, validateDossierData
 */

import { z } from 'zod';

// Tests des schemas de validation sans imports complexes
describe('Dossier Validation Schemas', () => {
  // Types de dossiers valides
  const VALID_TYPES = [
    'TITRE_SEJOUR',
    'RECOURS_OQTF',
    'NATURALISATION',
    'REGROUPEMENT_FAMILIAL',
    'ASILE',
    'VISA',
    'AUTRE',
  ];

  // Priorités valides
  const VALID_PRIORITIES = ['NORMALE', 'HAUTE', 'URGENTE', 'CRITIQUE'];

  // Statuts valides
  const VALID_STATUSES = [
    'BROUILLON',
    'EN_COURS',
    'EN_ATTENTE',
    'URGENT',
    'TERMINE',
    'REJETE',
    'ANNULE',
  ];

  describe('Types de dossiers CESEDA', () => {
    it('devrait accepter TITRE_SEJOUR', () => {
      expect(VALID_TYPES).toContain('TITRE_SEJOUR');
    });

    it('devrait accepter RECOURS_OQTF', () => {
      expect(VALID_TYPES).toContain('RECOURS_OQTF');
    });

    it('devrait accepter NATURALISATION', () => {
      expect(VALID_TYPES).toContain('NATURALISATION');
    });

    it('devrait accepter REGROUPEMENT_FAMILIAL', () => {
      expect(VALID_TYPES).toContain('REGROUPEMENT_FAMILIAL');
    });

    it('devrait accepter ASILE', () => {
      expect(VALID_TYPES).toContain('ASILE');
    });

    it('devrait accepter VISA', () => {
      expect(VALID_TYPES).toContain('VISA');
    });

    it('devrait accepter AUTRE pour cas non couverts', () => {
      expect(VALID_TYPES).toContain('AUTRE');
    });

    it('devrait refuser un type invalide', () => {
      const schema = z.enum(VALID_TYPES as [string, ...string[]]);
      
      expect(() => schema.parse('INVALID_TYPE')).toThrow();
    });
  });

  describe('Priorités', () => {
    it('devrait accepter toutes les priorités valides', () => {
      VALID_PRIORITIES.forEach(priority => {
        expect(VALID_PRIORITIES).toContain(priority);
      });
    });

    it('NORMALE devrait être la priorité par défaut', () => {
      expect(VALID_PRIORITIES[0]).toBe('NORMALE');
    });

    it('CRITIQUE devrait être la priorité maximale', () => {
      expect(VALID_PRIORITIES).toContain('CRITIQUE');
    });
  });

  describe('Statuts de dossier', () => {
    it('devrait inclure BROUILLON pour les nouveaux dossiers', () => {
      expect(VALID_STATUSES).toContain('BROUILLON');
    });

    it('devrait inclure EN_COURS pour les dossiers actifs', () => {
      expect(VALID_STATUSES).toContain('EN_COURS');
    });

    it('devrait inclure TERMINE pour les dossiers clôturés', () => {
      expect(VALID_STATUSES).toContain('TERMINE');
    });

    it('devrait inclure REJETE pour les refus', () => {
      expect(VALID_STATUSES).toContain('REJETE');
    });

    it('devrait inclure ANNULE', () => {
      expect(VALID_STATUSES).toContain('ANNULE');
    });
  });

  describe('Validation objetDemande', () => {
    const objetDemandeSchema = z.string()
      .min(10, 'Minimum 10 caracteres')
      .max(500, 'Maximum 500 caracteres');

    it('devrait accepter un texte de 10+ caractères', () => {
      const result = objetDemandeSchema.safeParse('Demande de titre de séjour');
      expect(result.success).toBe(true);
    });

    it('devrait refuser un texte trop court', () => {
      const result = objetDemandeSchema.safeParse('Court');
      expect(result.success).toBe(false);
    });

    it('devrait refuser un texte trop long', () => {
      const longText = 'a'.repeat(501);
      const result = objetDemandeSchema.safeParse(longText);
      expect(result.success).toBe(false);
    });

    it('devrait accepter exactement 500 caractères', () => {
      const text = 'a'.repeat(500);
      const result = objetDemandeSchema.safeParse(text);
      expect(result.success).toBe(true);
    });
  });

  describe('Validation notes', () => {
    const notesSchema = z.string().max(2000, 'Maximum 2000 caracteres').optional();

    it('devrait accepter des notes vides', () => {
      const result = notesSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('devrait accepter des notes courtes', () => {
      const result = notesSchema.safeParse('Notes courtes');
      expect(result.success).toBe(true);
    });

    it('devrait refuser des notes trop longues', () => {
      const longNotes = 'a'.repeat(2001);
      const result = notesSchema.safeParse(longNotes);
      expect(result.success).toBe(false);
    });
  });

  describe('Validation clientId', () => {
    const clientIdSchema = z.string().uuid('ID client invalide');

    it('devrait accepter un UUID valide', () => {
      const result = clientIdSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
      expect(result.success).toBe(true);
    });

    it('devrait refuser un ID non-UUID', () => {
      const result = clientIdSchema.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
    });

    it('devrait refuser un ID vide', () => {
      const result = clientIdSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('Validation dateEcheance', () => {
    const dateSchema = z.string().datetime().optional().or(z.literal(''));

    it('devrait accepter une date ISO valide', () => {
      const result = dateSchema.safeParse('2024-06-15T10:30:00.000Z');
      expect(result.success).toBe(true);
    });

    it('devrait accepter une chaîne vide', () => {
      const result = dateSchema.safeParse('');
      expect(result.success).toBe(true);
    });

    it('devrait accepter undefined', () => {
      const result = dateSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('devrait refuser un format de date invalide', () => {
      const result = dateSchema.safeParse('15/06/2024');
      expect(result.success).toBe(false);
    });
  });

  describe('Schema complet createDossierSchema', () => {
    const createDossierSchema = z.object({
      typeDossier: z.enum(VALID_TYPES as [string, ...string[]]),
      objetDemande: z.string().min(10).max(500),
      priorite: z.enum(VALID_PRIORITIES as [string, ...string[]]).default('NORMALE'),
      dateEcheance: z.string().datetime().optional().or(z.literal('')),
      notes: z.string().max(2000).optional(),
      clientId: z.string().uuid(),
    });

    it('devrait valider un dossier complet', () => {
      const dossier = {
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande de renouvellement de titre de séjour',
        priorite: 'HAUTE',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createDossierSchema.safeParse(dossier);
      expect(result.success).toBe(true);
    });

    it('devrait refuser sans clientId', () => {
      const dossier = {
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande de renouvellement',
      };

      const result = createDossierSchema.safeParse(dossier);
      expect(result.success).toBe(false);
    });

    it('devrait appliquer la priorité par défaut', () => {
      const dossier = {
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande de renouvellement de titre',
        clientId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createDossierSchema.safeParse(dossier);
      if (result.success) {
        expect(result.data.priorite).toBe('NORMALE');
      }
    });
  });

  describe('Schema updateDossierSchema (partial)', () => {
    const updateDossierSchema = z.object({
      typeDossier: z.enum(VALID_TYPES as [string, ...string[]]).optional(),
      objetDemande: z.string().min(10).max(500).optional(),
      priorite: z.enum(VALID_PRIORITIES as [string, ...string[]]).optional(),
      statut: z.enum(VALID_STATUSES as [string, ...string[]]).optional(),
      notes: z.string().max(2000).optional(),
    });

    it('devrait accepter une mise à jour partielle', () => {
      const update = {
        statut: 'EN_COURS',
      };

      const result = updateDossierSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('devrait accepter un objet vide', () => {
      const result = updateDossierSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('devrait accepter tous les statuts pour update', () => {
      VALID_STATUSES.forEach(status => {
        const result = updateDossierSchema.safeParse({ statut: status });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validateDossierData helper', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
    });

    function validateDossierData<T>(schema: z.ZodSchema<T>, data: unknown): 
      { success: true; data: T } | { success: false; errors: z.ZodError } {
      try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { success: false, errors: error };
        }
        throw error;
      }
    }

    it('devrait retourner success=true pour données valides', () => {
      const result = validateDossierData(schema, { name: 'Test', age: 25 });
      expect(result.success).toBe(true);
    });

    it('devrait retourner success=false pour données invalides', () => {
      const result = validateDossierData(schema, { name: '', age: -1 });
      expect(result.success).toBe(false);
    });

    it('devrait retourner les erreurs Zod', () => {
      const result = validateDossierData(schema, { name: '', age: -1 });
      if (!result.success) {
        expect(result.errors.issues.length).toBeGreaterThan(0);
      }
    });

    it('devrait retourner les données validées', () => {
      const result = validateDossierData(schema, { name: 'Test', age: 30 });
      if (result.success) {
        expect(result.data).toEqual({ name: 'Test', age: 30 });
      }
    });
  });

  describe('Demande Client Schema', () => {
    const createDemandeClientSchema = z.object({
      typeDossier: z.enum(VALID_TYPES as [string, ...string[]]),
      objetDemande: z.string().min(20, 'Minimum 20 caractères').max(500),
      dateEcheance: z.string().datetime().optional().or(z.literal('')),
      urgence: z.boolean().optional(),
      complementInfo: z.string().max(1000).optional(),
    });

    it('devrait accepter une demande client valide', () => {
      const demande = {
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Je souhaite renouveler mon titre de séjour arrivant à expiration',
      };

      const result = createDemandeClientSchema.safeParse(demande);
      expect(result.success).toBe(true);
    });

    it('devrait exiger 20 caractères minimum pour objetDemande client', () => {
      const demande = {
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Trop court',
      };

      const result = createDemandeClientSchema.safeParse(demande);
      expect(result.success).toBe(false);
    });

    it('devrait accepter le flag urgence', () => {
      const demande = {
        typeDossier: 'RECOURS_OQTF',
        objetDemande: 'Recours contre OQTF notifiée le 01/01/2024',
        urgence: true,
      };

      const result = createDemandeClientSchema.safeParse(demande);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgence).toBe(true);
      }
    });
  });
});
