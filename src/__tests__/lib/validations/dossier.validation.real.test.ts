/**
 * Tests réels pour les schemas de validation Zod des dossiers
 * Ces tests IMPORTENT le vrai fichier pour augmenter le coverage
 */

import {
  dossierBaseSchema,
  createDossierSchema,
  createDemandeClientSchema,
  updateDossierSchema,
  validateDossierData,
} from '@/lib/validations/dossier.validation';

describe('dossierBaseSchema - Tests Réels', () => {
  describe('typeDossier validation', () => {
    it('devrait accepter TITRE_SEJOUR', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande de titre de sejour valide',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter RECOURS_OQTF', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'RECOURS_OQTF',
        objetDemande: 'Recours contre OQTF valide',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter NATURALISATION', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'NATURALISATION',
        objetDemande: 'Demande de naturalisation valide',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter REGROUPEMENT_FAMILIAL', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'REGROUPEMENT_FAMILIAL',
        objetDemande: 'Demande de regroupement familial valide',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter ASILE', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'ASILE',
        objetDemande: 'Demande d asile valide',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter VISA', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'VISA',
        objetDemande: 'Demande de visa valide',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter AUTRE', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'AUTRE',
        objetDemande: 'Autre type de demande valide',
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un type invalide', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TYPE_INEXISTANT',
        objetDemande: 'Test de type invalide',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('objetDemande validation', () => {
    it('devrait accepter une demande de 10 caractères minimum', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: '1234567890', // exactement 10
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une demande trop courte', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Court',
      });
      expect(result.success).toBe(false);
    });

    it('devrait accepter une demande de 500 caractères', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'A'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une demande de plus de 500 caractères', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('priorite validation', () => {
    it('devrait avoir NORMALE par défaut', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priorite).toBe('NORMALE');
      }
    });

    it('devrait accepter HAUTE', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
        priorite: 'HAUTE',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter URGENTE', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
        priorite: 'URGENTE',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter CRITIQUE', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
        priorite: 'CRITIQUE',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('dateEcheance validation', () => {
    it('devrait accepter une date ISO valide', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
        dateEcheance: '2024-12-31T23:59:59.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('devrait accepter une chaîne vide', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
        dateEcheance: '',
      });
      expect(result.success).toBe(true);
    });

    it('devrait être optionnel', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateEcheance).toBeUndefined();
      }
    });
  });

  describe('notes validation', () => {
    it('devrait accepter des notes', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
        notes: 'Notes importantes sur le dossier',
      });
      expect(result.success).toBe(true);
    });

    it('devrait rejeter des notes > 2000 caractères', () => {
      const result = dossierBaseSchema.safeParse({
        typeDossier: 'TITRE_SEJOUR',
        objetDemande: 'Demande valide test',
        notes: 'A'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('createDossierSchema - Tests Réels', () => {
  it('devrait valider un dossier complet', () => {
    const result = createDossierSchema.safeParse({
      typeDossier: 'RECOURS_OQTF',
      objetDemande: 'Recours contre OQTF urgent',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      priorite: 'URGENTE',
    });
    expect(result.success).toBe(true);
  });

  it('devrait rejeter un clientId non-UUID', () => {
    const result = createDossierSchema.safeParse({
      typeDossier: 'TITRE_SEJOUR',
      objetDemande: 'Demande valide test',
      clientId: 'invalid-id-format',
    });
    expect(result.success).toBe(false);
  });

  it('devrait accepter un statut BROUILLON', () => {
    const result = createDossierSchema.safeParse({
      typeDossier: 'TITRE_SEJOUR',
      objetDemande: 'Demande valide test',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      statut: 'BROUILLON',
    });
    expect(result.success).toBe(true);
  });

  it('devrait accepter un statut EN_COURS', () => {
    const result = createDossierSchema.safeParse({
      typeDossier: 'TITRE_SEJOUR',
      objetDemande: 'Demande valide test',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      statut: 'EN_COURS',
    });
    expect(result.success).toBe(true);
  });

  it('devrait accepter un statut URGENT', () => {
    const result = createDossierSchema.safeParse({
      typeDossier: 'TITRE_SEJOUR',
      objetDemande: 'Demande valide test',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
      statut: 'URGENT',
    });
    expect(result.success).toBe(true);
  });
});

describe('createDemandeClientSchema - Tests Réels', () => {
  it('devrait valider une demande client simple', () => {
    const result = createDemandeClientSchema.safeParse({
      typeDossier: 'ASILE',
      objetDemande: 'Description de ma demande qui fait au moins 20 caracteres',
    });
    expect(result.success).toBe(true);
  });

  it('devrait exiger 20 caractères minimum pour objetDemande', () => {
    const result = createDemandeClientSchema.safeParse({
      typeDossier: 'VISA',
      objetDemande: 'Trop court',
    });
    expect(result.success).toBe(false);
  });

  it('devrait accepter urgence=true', () => {
    const result = createDemandeClientSchema.safeParse({
      typeDossier: 'RECOURS_OQTF',
      objetDemande: 'Mon recours OQTF est tres urgent',
      urgence: true,
    });
    expect(result.success).toBe(true);
  });

  it('devrait accepter complementInfo', () => {
    const result = createDemandeClientSchema.safeParse({
      typeDossier: 'NATURALISATION',
      objetDemande: 'Demande de naturalisation francaise',
      complementInfo: 'Je vis en France depuis 10 ans',
    });
    expect(result.success).toBe(true);
  });

  it('devrait rejeter complementInfo > 1000 caractères', () => {
    const result = createDemandeClientSchema.safeParse({
      typeDossier: 'TITRE_SEJOUR',
      objetDemande: 'Demande de titre de sejour',
      complementInfo: 'A'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('updateDossierSchema - Tests Réels', () => {
  it('devrait accepter un objet vide (mise à jour partielle)', () => {
    const result = updateDossierSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('devrait accepter une mise à jour de priorité seule', () => {
    const result = updateDossierSchema.safeParse({
      priorite: 'CRITIQUE',
    });
    expect(result.success).toBe(true);
  });

  it('devrait accepter tous les statuts finaux', () => {
    const statuts = ['TERMINE', 'REJETE', 'ANNULE'];
    statuts.forEach(statut => {
      const result = updateDossierSchema.safeParse({ statut });
      expect(result.success).toBe(true);
    });
  });

  it('devrait accepter une mise à jour multiple', () => {
    const result = updateDossierSchema.safeParse({
      priorite: 'HAUTE',
      statut: 'EN_COURS',
      notes: 'Mise à jour des notes',
    });
    expect(result.success).toBe(true);
  });
});

describe('validateDossierData - Tests Réels', () => {
  it('devrait retourner success=true avec données valides', () => {
    const result = validateDossierData(dossierBaseSchema, {
      typeDossier: 'TITRE_SEJOUR',
      objetDemande: 'Demande valide de test',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.typeDossier).toBe('TITRE_SEJOUR');
    }
  });

  it('devrait retourner success=false avec erreurs Zod', () => {
    const result = validateDossierData(dossierBaseSchema, {
      typeDossier: 'INVALIDE',
      objetDemande: 'x',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.issues.length).toBeGreaterThan(0);
    }
  });

  it('devrait fonctionner avec createDossierSchema', () => {
    const result = validateDossierData(createDossierSchema, {
      typeDossier: 'VISA',
      objetDemande: 'Demande de visa valide',
      clientId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('devrait propager les erreurs non-Zod', () => {
    const mockSchema = {
      parse: () => { throw new Error('Erreur interne'); },
    };
    expect(() => validateDossierData(mockSchema as any, {})).toThrow('Erreur interne');
  });
});
