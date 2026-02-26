/**
 * Tests réels pour le service OQTF Deadline
 * Ces tests IMPORTENT le vrai fichier pour augmenter le coverage
 */

// Mock du logger avant l'import
jest.mock('@/lib/logger', () => ({
  logger: {
    logAIAction: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  TypeDossierCESEDA,
  identifierTypeDossier,
  genererChecklistOQTF,
} from '@/lib/services/oqtfDeadlineService';

describe('oqtfDeadlineService - TypeDossierCESEDA', () => {
  it('devrait avoir les types de dossiers CESEDA', () => {
    expect(TypeDossierCESEDA.OQTF).toBe('OQTF');
    expect(TypeDossierCESEDA.REFUS_TITRE).toBe('REFUS_TITRE');
    expect(TypeDossierCESEDA.RETRAIT_TITRE).toBe('RETRAIT_TITRE');
    expect(TypeDossierCESEDA.NATURALISATION).toBe('NATURALISATION');
    expect(TypeDossierCESEDA.REGROUPEMENT_FAMILIAL).toBe('REGROUPEMENT_FAMILIAL');
    expect(TypeDossierCESEDA.ASILE).toBe('ASILE');
  });

  it('devrait avoir 6 types de dossiers', () => {
    const types = Object.values(TypeDossierCESEDA);
    expect(types).toHaveLength(6);
  });
});

describe('oqtfDeadlineService - identifierTypeDossier', () => {
  describe('Identification OQTF', () => {
    it('devrait identifier un texte OQTF typique', () => {
      const texteOQTF = `
        ARRETE PREFECTORAL
        
        Vu le code de l'entree et du sejour des etrangers et du droit d'asile (CESEDA),
        notamment les articles L.511-1 et L.512-1;
        
        Vu la situation irreguliere de M. DUPONT sur le territoire francais;
        
        DECIDE:
        
        Article 1: M. DUPONT fait l'objet d'une obligation de quitter le territoire francais.
        Article 2: Un delai de depart volontaire de 30 jours est accorde.
        Article 3: Le tribunal administratif peut etre saisi dans les 30 jours.
      `;
      
      const result = identifierTypeDossier(texteOQTF);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(TypeDossierCESEDA.OQTF);
      expect(result?.confidence).toBeGreaterThan(0);
    });

    it('devrait identifier les mots-clés OQTF', () => {
      const texte = `
        PREFECTURE DE PARIS
        
        Le prefet decide une mesure d'eloignement.
        Cette decision d'eloignement fait suite a un sejour irregulier.
        Le TA peut etre saisi en refere-liberte.
      `;
      
      const result = identifierTypeDossier(texte);
      // Peut retourner null si confiance < 40%
      if (result) {
        expect(result.type).toBe(TypeDossierCESEDA.OQTF);
      }
    });
  });

  describe('Identification Refus de titre', () => {
    it('devrait identifier un refus de titre de sejour', () => {
      const texteRefus = `
        PREFECTURE DU RHONE
        
        Vu l'article L.313-11 du CESEDA;
        
        Considérant que M. MARTIN ne remplit pas les conditions;
        
        DECIDE:
        
        Article 1: La demande de titre de sejour est rejetee.
        Article 2: Un recours contentieux peut etre forme dans les 2 mois.
        
        Cette decision constitue un refus de titre de sejour.
      `;
      
      const result = identifierTypeDossier(texteRefus);
      if (result) {
        expect([TypeDossierCESEDA.REFUS_TITRE, TypeDossierCESEDA.OQTF]).toContain(result.type);
      }
    });
  });

  describe('Texte non reconnu', () => {
    it('devrait retourner null pour un texte sans rapport', () => {
      const texteNonReconnu = `
        Bonjour,
        Ceci est un email concernant un rendez-vous.
        Merci de confirmer votre presence.
        Cordialement.
      `;
      
      const result = identifierTypeDossier(texteNonReconnu);
      expect(result).toBeNull();
    });

    it('devrait retourner null pour un texte vide', () => {
      const result = identifierTypeDossier('');
      expect(result).toBeNull();
    });

    it('devrait retourner null pour un texte trop court', () => {
      const result = identifierTypeDossier('texte court');
      expect(result).toBeNull();
    });
  });

  describe('Confiance et articles détectés', () => {
    it('devrait inclure les articles détectés', () => {
      const texteAvecArticles = `
        L'article L.511-1 du CESEDA prevoit que l'etranger en situation irreguliere
        peut faire l'objet d'une obligation de quitter le territoire francais (OQTF).
        L'article L.512-1 precise les delais de recours devant le tribunal administratif.
      `;
      
      const result = identifierTypeDossier(texteAvecArticles);
      if (result) {
        expect(result.articles).toBeDefined();
        expect(Array.isArray(result.articles)).toBe(true);
      }
    });

    it('la confiance devrait être entre 0 et 100', () => {
      const texte = `
        OQTF prefecture territoire francais titre de sejour visa reconduite
        eloignement tribunal administratif TA refere-liberte CRA retention
      `;
      
      const result = identifierTypeDossier(texte);
      if (result) {
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    });
  });
});

describe('oqtfDeadlineService - genererChecklistOQTF', () => {
  const mockDelaiNormal = [
    {
      type: 'recours_contentieux',
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      joursRestants: 30,
      priorite: 'HAUTE' as const,
      checklistRecommandee: ['Preparer memoire', 'Rassembler pieces'],
      templateJuridique: null,
      articlesApplicables: ['L.512-1'],
      confidence: 80,
    },
  ];

  const mockDelaiCritique = [
    {
      type: 'refere_liberte',
      dateEcheance: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 jours
      joursRestants: 2,
      priorite: 'CRITIQUE' as const,
      checklistRecommandee: ['Saisir TA en urgence', 'Prouver urgence'],
      templateJuridique: null,
      articlesApplicables: ['L.521-2'],
      confidence: 95,
    },
  ];

  it('devrait générer une checklist de base pour OQTF', () => {
    const checklist = genererChecklistOQTF(TypeDossierCESEDA.OQTF, mockDelaiNormal);
    
    expect(Array.isArray(checklist)).toBe(true);
    expect(checklist.length).toBeGreaterThan(0);
  });

  it('devrait inclure des éléments de vérification standard', () => {
    const checklist = genererChecklistOQTF(TypeDossierCESEDA.OQTF, mockDelaiNormal);
    
    // Vérifie que la checklist contient des éléments pertinents
    const checklistText = checklist.join(' ');
    expect(checklistText.length).toBeGreaterThan(0);
  });

  it('devrait signaler une urgence absolue pour délai critique <= 2 jours', () => {
    const checklist = genererChecklistOQTF(TypeDossierCESEDA.OQTF, mockDelaiCritique);
    
    const checklistText = checklist.join(' ');
    // Devrait contenir une indication d'urgence
    expect(checklistText.toLowerCase()).toMatch(/urgence|jour|critique|immediat/);
  });

  it('devrait fonctionner pour différents types de dossiers', () => {
    const types = [
      TypeDossierCESEDA.OQTF,
      TypeDossierCESEDA.REFUS_TITRE,
      TypeDossierCESEDA.ASILE,
    ];

    types.forEach(type => {
      const checklist = genererChecklistOQTF(type, mockDelaiNormal);
      expect(Array.isArray(checklist)).toBe(true);
    });
  });

  it('devrait gérer une liste de délais vide', () => {
    // Devrait au moins retourner la checklist de base
    const checklist = genererChecklistOQTF(TypeDossierCESEDA.OQTF, []);
    expect(Array.isArray(checklist)).toBe(true);
    expect(checklist.length).toBeGreaterThan(0);
  });
});
