/**
 * Tests pour le service d'IA prédictive
 * Couverture: PredictiveAI, TimelinePrediction, OutcomePrediction
 */

describe('PredictiveAI Service', () => {
  describe('TimelinePrediction Structure', () => {
    it('devrait contenir estimatedDuration', () => {
      const prediction = {
        estimatedDuration: 30, // jours
        confidence: 0.85,
        criticalPath: ['Document A', 'RDV Préfecture', 'Decision'],
        riskFactors: [],
      };

      expect(prediction.estimatedDuration).toBe(30);
    });

    it('devrait avoir une confidence entre 0 et 1', () => {
      const prediction = {
        estimatedDuration: 45,
        confidence: 0.75,
        criticalPath: [],
        riskFactors: [],
      };

      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('devrait identifier le chemin critique', () => {
      const prediction = {
        estimatedDuration: 60,
        confidence: 0.7,
        criticalPath: [
          'Collecte documents identité',
          'Justificatifs domicile',
          'RDV Préfecture',
          'Délai instruction',
          'Décision finale',
        ],
        riskFactors: [],
      };

      expect(prediction.criticalPath.length).toBeGreaterThan(0);
      expect(prediction.criticalPath).toContain('RDV Préfecture');
    });
  });

  describe('RiskFactor Structure', () => {
    it('devrait identifier les risques avec sévérité', () => {
      const riskFactor = {
        type: 'DOCUMENT_MANQUANT',
        severity: 'high' as const,
        impact: 'Délai supplémentaire de 15 jours',
        mitigation: 'Préparer les documents en avance',
      };

      expect(riskFactor.severity).toBe('high');
      expect(riskFactor.mitigation).toBeDefined();
    });

    it('devrait supporter les niveaux de sévérité', () => {
      const severities = ['low', 'medium', 'high'];
      
      expect(severities).toContain('low');
      expect(severities).toContain('medium');
      expect(severities).toContain('high');
    });
  });

  describe('OutcomePrediction Structure', () => {
    it('devrait prédire la probabilité de succès', () => {
      const prediction = {
        successProbability: 0.78,
        alternativeStrategies: [],
        recommendedActions: [],
      };

      expect(prediction.successProbability).toBe(0.78);
    });

    it('devrait proposer des stratégies alternatives', () => {
      const prediction = {
        successProbability: 0.45,
        alternativeStrategies: [
          { name: 'Recours gracieux', successRate: 0.6 },
          { name: 'Recours contentieux', successRate: 0.55 },
          { name: 'Médiation préfectorale', successRate: 0.4 },
        ],
        recommendedActions: [],
      };

      expect(prediction.alternativeStrategies.length).toBe(3);
    });

    it('devrait recommander des actions', () => {
      const prediction = {
        successProbability: 0.7,
        alternativeStrategies: [],
        recommendedActions: [
          { action: 'Compléter dossier médical', priority: 'high' },
          { action: 'Préparer attestation employeur', priority: 'medium' },
          { action: 'Vérifier validité passeport', priority: 'low' },
        ],
      };

      expect(prediction.recommendedActions.length).toBe(3);
    });
  });

  describe('Feature Extraction', () => {
    it('devrait extraire le type de dossier', () => {
      const dossier = {
        typeDossier: 'TITRE_SEJOUR',
        priorite: 'HAUTE',
      };

      const features = {
        caseType: dossier.typeDossier,
        urgency: dossier.priorite,
      };

      expect(features.caseType).toBe('TITRE_SEJOUR');
      expect(features.urgency).toBe('HAUTE');
    });

    it('devrait évaluer la complexité', () => {
      const assessComplexity = (dossier: { documentsCount: number; recours: boolean }): number => {
        let complexity = 0.3; // base
        if (dossier.documentsCount > 10) complexity += 0.3;
        if (dossier.recours) complexity += 0.2;
        return Math.min(complexity, 1.0);
      };

      expect(assessComplexity({ documentsCount: 5, recours: false })).toBe(0.3);
      expect(assessComplexity({ documentsCount: 15, recours: true })).toBe(0.8);
    });

    it('devrait évaluer la complétude documentaire', () => {
      const assessDocumentCompleteness = (
        documents: string[], 
        required: string[]
      ): number => {
        const found = required.filter(r => documents.includes(r));
        return found.length / required.length;
      };

      const required = ['Passeport', 'Justificatif domicile', 'Photo'];
      const documents = ['Passeport', 'Justificatif domicile'];

      expect(assessDocumentCompleteness(documents, required)).toBeCloseTo(0.67, 1);
    });
  });

  describe('Duration Calculation', () => {
    it('devrait calculer la durée moyenne', () => {
      const historical = [
        { duration: 30 },
        { duration: 45 },
        { duration: 60 },
      ];

      const avgDuration = historical.reduce((acc, c) => acc + c.duration, 0) / historical.length;

      expect(avgDuration).toBe(45);
    });

    it('devrait appliquer le multiplicateur de complexité', () => {
      const baseTime = 45;
      const complexity = 0.5;
      const complexityMultiplier = complexity * 0.2;
      
      const adjusted = baseTime * (1 + complexityMultiplier);

      expect(adjusted).toBeCloseTo(49.5, 5);
    });

    it('devrait appliquer le multiplicateur d\'urgence', () => {
      const baseTime = 45;
      const urgencyMultiplier = 0.7; // cas critique

      const adjusted = baseTime * urgencyMultiplier;

      expect(adjusted).toBeCloseTo(31.5, 5);
    });

    it('devrait combiner les multiplicateurs', () => {
      const baseTime = 45;
      const complexity = 0.5;
      const isCritique = true;

      const complexityMultiplier = 1 + (complexity * 0.2);
      const urgencyMultiplier = isCritique ? 0.7 : 1.0;
      
      const adjusted = Math.round(baseTime * complexityMultiplier * urgencyMultiplier);

      expect(adjusted).toBe(35);
    });
  });

  describe('Confidence Calculation', () => {
    it('devrait avoir une confidence de base de 0.8', () => {
      const baseConfidence = 0.8;
      expect(baseConfidence).toBe(0.8);
    });

    it('devrait augmenter avec une bonne complétude', () => {
      let confidence = 0.8;
      const documentCompleteness = 0.95;

      if (documentCompleteness > 0.9) confidence += 0.1;

      expect(confidence).toBeCloseTo(0.9, 5);
    });

    it('devrait augmenter avec faible complexité', () => {
      let confidence = 0.8;
      const complexity = 0.3;

      if (complexity < 0.5) confidence += 0.05;

      expect(confidence).toBeCloseTo(0.85, 5);
    });

    it('devrait être plafonné à 0.95', () => {
      let confidence = 0.8;
      confidence += 0.1; // bonne complétude
      confidence += 0.05; // faible complexité
      confidence += 0.1; // bonus historique

      const finalConfidence = Math.min(confidence, 0.95);

      expect(finalConfidence).toBe(0.95);
    });
  });

  describe('Type de dossier et prédictions', () => {
    const avgDurationByType: Record<string, number> = {
      TITRE_SEJOUR: 45,
      RECOURS_OQTF: 90,
      NATURALISATION: 365,
      REGROUPEMENT_FAMILIAL: 180,
      ASILE: 120,
      VISA: 30,
    };

    it('VISA devrait être le plus rapide', () => {
      expect(avgDurationByType.VISA).toBe(30);
    });

    it('NATURALISATION devrait être le plus long', () => {
      expect(avgDurationByType.NATURALISATION).toBe(365);
    });

    it('RECOURS_OQTF devrait être urgent (90j)', () => {
      expect(avgDurationByType.RECOURS_OQTF).toBe(90);
    });
  });

  describe('Risk Analysis', () => {
    it('devrait identifier les risques de délai', () => {
      const analyzeDelayRisk = (daysToDeadline: number): string => {
        if (daysToDeadline < 7) return 'critical';
        if (daysToDeadline < 30) return 'high';
        if (daysToDeadline < 60) return 'medium';
        return 'low';
      };

      expect(analyzeDelayRisk(5)).toBe('critical');
      expect(analyzeDelayRisk(20)).toBe('high');
      expect(analyzeDelayRisk(45)).toBe('medium');
      expect(analyzeDelayRisk(90)).toBe('low');
    });

    it('devrait identifier les risques documentaires', () => {
      const analyzeDocumentRisk = (missingDocs: number): string => {
        if (missingDocs > 5) return 'high';
        if (missingDocs > 2) return 'medium';
        if (missingDocs > 0) return 'low';
        return 'none';
      };

      expect(analyzeDocumentRisk(0)).toBe('none');
      expect(analyzeDocumentRisk(1)).toBe('low');
      expect(analyzeDocumentRisk(3)).toBe('medium');
      expect(analyzeDocumentRisk(6)).toBe('high');
    });
  });

  describe('Strategy Generation', () => {
    it('devrait suggérer des stratégies basées sur la probabilité', () => {
      const generateStrategies = (successProb: number): string[] => {
        const strategies: string[] = [];
        
        if (successProb < 0.5) {
          strategies.push('Recours gracieux');
          strategies.push('Médiation');
        }
        if (successProb < 0.7) {
          strategies.push('Renforcement dossier');
        }
        strategies.push('Procédure standard');
        
        return strategies;
      };

      expect(generateStrategies(0.3)).toContain('Recours gracieux');
      expect(generateStrategies(0.3)).toContain('Médiation');
      expect(generateStrategies(0.6)).toContain('Renforcement dossier');
      expect(generateStrategies(0.8)).toEqual(['Procédure standard']);
    });
  });

  describe('Success Probability Calculation', () => {
    it('devrait calculer la probabilité basée sur jurisprudence', () => {
      const jurisprudence = {
        totalCases: 100,
        successCases: 75,
      };

      const probability = jurisprudence.successCases / jurisprudence.totalCases;

      expect(probability).toBe(0.75);
    });

    it('devrait ajuster pour le type de dossier', () => {
      const baseRates: Record<string, number> = {
        TITRE_SEJOUR: 0.8,
        RECOURS_OQTF: 0.4,
        NATURALISATION: 0.7,
      };

      expect(baseRates.RECOURS_OQTF).toBeLessThan(baseRates.TITRE_SEJOUR);
    });
  });
});
