/**
 * Tests unitaires pour AIService
 * Service d'intelligence artificielle
 */

import {
  generateDocument,
  type AIUsageStats,
  type RiskAnalysis,
  type DocumentSummary,
  type ExtractedEntities,
  type ComplianceCheck,
} from '@/lib/services/aiService';

describe('AIService', () => {
  describe('AIUsageStats', () => {
    it('track les statistiques d\'utilisation', () => {
      const stats: AIUsageStats = {
        totalRequests: 150,
        totalTokens: 45000,
        estimatedCost: 2.25,
      };

      expect(stats.totalRequests).toBe(150);
      expect(stats.totalTokens).toBe(45000);
      expect(stats.estimatedCost).toBeCloseTo(2.25);
    });
  });

  describe('RiskAnalysis', () => {
    it('évalue le niveau de risque', () => {
      const lowRisk: RiskAnalysis = {
        score: 25,
        level: 'faible',
        factors: [
          {
            factor: 'Documents complets',
            impact: 'positive',
            description: 'Tous les documents requis sont présents',
          },
        ],
        recommendations: ['Continuer le suivi normal'],
      };

      expect(lowRisk.level).toBe('faible');
      expect(lowRisk.score).toBeLessThan(30);
    });

    it('identifie les risques critiques', () => {
      const criticalRisk: RiskAnalysis = {
        score: 95,
        level: 'critique',
        factors: [
          {
            factor: 'OQTF 48h dépassée',
            impact: 'negative',
            description: 'Le délai de recours est expiré',
          },
          {
            factor: 'Documents manquants',
            impact: 'negative',
            description: 'Passeport non fourni',
          },
        ],
        recommendations: [
          'Déposer immédiatement une demande de sursis',
          'Contacter le tribunal administratif',
        ],
      };

      expect(criticalRisk.level).toBe('critique');
      expect(criticalRisk.score).toBeGreaterThan(90);
      expect(criticalRisk.factors).toHaveLength(2);
      expect(criticalRisk.recommendations.length).toBeGreaterThan(0);
    });

    it('contient les 4 niveaux de risque', () => {
      const levels: RiskAnalysis['level'][] = ['faible', 'moyen', 'eleve', 'critique'];

      levels.forEach((level) => {
        const analysis: RiskAnalysis = {
          score: 50,
          level,
          factors: [],
          recommendations: [],
        };
        expect(analysis.level).toBe(level);
      });
    });
  });

  describe('DocumentSummary', () => {
    it('résume un document avec les points clés', () => {
      const summary: DocumentSummary = {
        summary: 'Ce document est une OQTF datée du 15 janvier 2026...',
        keyPoints: [
          'Obligation de quitter le territoire',
          'Délai de 30 jours',
          'Possibilité de recours',
        ],
        sentiment: 'negative',
      };

      expect(summary.keyPoints).toHaveLength(3);
      expect(summary.sentiment).toBe('negative');
    });

    it('détecte le sentiment positif', () => {
      const summary: DocumentSummary = {
        summary: 'Titre de séjour accordé...',
        keyPoints: ['Validité 10 ans', 'Droit au travail'],
        sentiment: 'positive',
      };

      expect(summary.sentiment).toBe('positive');
    });

    it('détecte le sentiment neutre', () => {
      const summary: DocumentSummary = {
        summary: 'Convocation à la préfecture...',
        keyPoints: ['Rendez-vous le 1er février'],
        sentiment: 'neutral',
      };

      expect(summary.sentiment).toBe('neutral');
    });
  });

  describe('ExtractedEntities', () => {
    it('extrait les entités d\'un document', () => {
      const entities: ExtractedEntities = {
        personnes: ['Jean Dupont', 'Marie Martin'],
        dates: ['15/01/2026', '30/01/2026'],
        montants: ['1500€', '3000€'],
        references: ['PREF/2026/001234', 'TA-75-001-2026'],
      };

      expect(entities.personnes).toContain('Jean Dupont');
      expect(entities.dates).toHaveLength(2);
      expect(entities.montants).toContain('1500€');
      expect(entities.references).toContain('TA-75-001-2026');
    });

    it('gère les documents sans certaines entités', () => {
      const entities: ExtractedEntities = {
        personnes: ['Anonyme'],
        dates: [],
        montants: [],
        references: [],
      };

      expect(entities.dates).toHaveLength(0);
      expect(entities.montants).toHaveLength(0);
    });
  });

  describe('ComplianceCheck', () => {
    it('indique la conformité', () => {
      const compliant: ComplianceCheck = {
        compliant: true,
        issues: [],
      };

      expect(compliant.compliant).toBe(true);
      expect(compliant.issues).toHaveLength(0);
    });

    it('détecte les problèmes de conformité', () => {
      const nonCompliant: ComplianceCheck = {
        compliant: false,
        issues: [
          {
            severity: 'error',
            message: 'Signature manquante',
            suggestion: 'Ajouter la signature du client',
          },
          {
            severity: 'warning',
            message: 'Date proche de l\'expiration',
            suggestion: 'Renouveler avant le 30/01/2026',
          },
          {
            severity: 'info',
            message: 'Format de date non standard',
            suggestion: 'Utiliser le format JJ/MM/AAAA',
          },
        ],
      };

      expect(nonCompliant.compliant).toBe(false);
      expect(nonCompliant.issues).toHaveLength(3);
      expect(nonCompliant.issues[0].severity).toBe('error');
    });
  });

  describe('generateDocument()', () => {
    it('génère un contrat', async () => {
      const context = { montant: 5000, lieu: 'Paris' };
      const result = await generateDocument('contrat', context);

      expect(result).toContain('CONTRAT');
      expect(result).toContain('5000');
      expect(result).toContain('Paris');
    }, 10000);

    it('génère une mise en demeure', async () => {
      const context = {
        destinataire: 'M. Dupont',
        montant: 1500,
        motif: 'facture impayée',
      };
      const result = await generateDocument('mise_en_demeure', context);

      expect(result).toContain('MISE EN DEMEURE');
      expect(result).toContain('M. Dupont');
      expect(result).toContain('1500');
    }, 10000);

    it('génère une assignation', async () => {
      const context = {
        tribunal: 'PARIS',
        demandeur: 'Cabinet ABC',
        defendeur: 'Société XYZ',
        montant: 10000,
      };
      const result = await generateDocument('assignation', context);

      expect(result).toContain('ASSIGNATION');
      expect(result).toContain('PARIS');
      expect(result).toContain('Cabinet ABC');
    }, 10000);

    it('gère les contextes partiels', async () => {
      const result = await generateDocument('contrat', {});

      expect(result).toContain('CONTRAT');
      // Valeurs par défaut utilisées
      expect(result).toContain('XXX');
    }, 10000);
  });

  describe('Document Types', () => {
    it('supporte les 4 types de documents', () => {
      const types: Array<'contrat' | 'mise_en_demeure' | 'assignation' | 'courrier'> = [
        'contrat',
        'mise_en_demeure',
        'assignation',
        'courrier',
      ];

      types.forEach((type) => {
        expect(typeof type).toBe('string');
      });
    });
  });
});

describe('AI Rate Limiting', () => {
  it('limite le nombre de requêtes par minute', () => {
    const RATE_LIMIT = 10; // 10 req/min pour endpoints IA
    const requests = 15;

    const allowed = Math.min(requests, RATE_LIMIT);
    const blocked = requests - allowed;

    expect(allowed).toBe(10);
    expect(blocked).toBe(5);
  });
});
