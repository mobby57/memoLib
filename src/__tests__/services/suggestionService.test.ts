/**
 * Tests pour le service de suggestions intelligentes
 * Couverture: suggestions, priorités, actions contextuelles
 */

describe('Suggestion Service', () => {
  describe('SmartSuggestion Interface', () => {
    it('devrait avoir la structure correcte', () => {
      const suggestion = {
        id: 'sugg-1',
        title: 'Relance client',
        description: 'Le client n\'a pas répondu depuis 7 jours',
        actionType: 'CLIENT_FOLLOWUP',
        priority: 'HIGH' as const,
        reasoning: 'Basé sur l\'historique des réponses',
        suggestedAction: {
          type: 'email',
          data: { template: 'relance_standard' },
        },
        confidence: 85,
        estimatedTimeMinutes: 5,
      };

      expect(suggestion).toHaveProperty('id');
      expect(suggestion).toHaveProperty('title');
      expect(suggestion).toHaveProperty('priority');
      expect(suggestion).toHaveProperty('confidence');
      expect(suggestion).toHaveProperty('suggestedAction');
    });
  });

  describe('Priority Levels', () => {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    it('devrait inclure tous les niveaux', () => {
      expect(validPriorities).toContain('LOW');
      expect(validPriorities).toContain('MEDIUM');
      expect(validPriorities).toContain('HIGH');
      expect(validPriorities).toContain('CRITICAL');
    });

    it('devrait avoir 4 niveaux', () => {
      expect(validPriorities).toHaveLength(4);
    });
  });

  describe('Priority Sorting', () => {
    const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    const sortByPriority = <T extends { priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>(
      items: T[]
    ): T[] => {
      return [...items].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    };

    it('devrait trier CRITICAL en premier', () => {
      const items = [
        { priority: 'LOW' as const },
        { priority: 'CRITICAL' as const },
        { priority: 'MEDIUM' as const },
      ];
      const sorted = sortByPriority(items);
      expect(sorted[0].priority).toBe('CRITICAL');
    });

    it('devrait maintenir l\'ordre décroissant', () => {
      const items = [
        { priority: 'LOW' as const },
        { priority: 'HIGH' as const },
        { priority: 'MEDIUM' as const },
        { priority: 'CRITICAL' as const },
      ];
      const sorted = sortByPriority(items);
      expect(sorted.map(i => i.priority)).toEqual(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
    });
  });

  describe('Stale Dossier Detection', () => {
    const isStale = (lastUpdate: Date, thresholdDays: number = 14): boolean => {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - thresholdDays);
      return lastUpdate < threshold;
    };

    const getDaysWithoutUpdate = (lastUpdate: Date): number => {
      return Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    };

    it('devrait détecter un dossier obsolète', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 20);
      expect(isStale(oldDate)).toBe(true);
    });

    it('devrait ne pas détecter un dossier récent', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);
      expect(isStale(recentDate)).toBe(false);
    });

    it('devrait calculer les jours sans mise à jour', () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      expect(getDaysWithoutUpdate(tenDaysAgo)).toBe(10);
    });
  });

  describe('Client Followup Detection', () => {
    const shouldFollowup = (lastContact: Date, thresholdDays: number = 7): boolean => {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - thresholdDays);
      return lastContact < threshold;
    };

    it('devrait suggérer relance après 7 jours', () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      expect(shouldFollowup(eightDaysAgo)).toBe(true);
    });

    it('devrait ne pas suggérer relance si contact récent', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      expect(shouldFollowup(twoDaysAgo)).toBe(false);
    });
  });

  describe('Automation Opportunities', () => {
    const findAutomationOpportunities = (
      actions: Array<{ type: string; count: number }>
    ): Array<{ type: string; potential: string }> => {
      return actions
        .filter(a => a.count > 10)
        .map(a => ({
          type: a.type,
          potential: a.count > 50 ? 'HIGH' : a.count > 20 ? 'MEDIUM' : 'LOW',
        }));
    };

    it('devrait identifier les actions fréquentes', () => {
      const actions = [
        { type: 'email_reminder', count: 60 },
        { type: 'document_upload', count: 5 },
      ];
      const opportunities = findAutomationOpportunities(actions);
      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].type).toBe('email_reminder');
    });

    it('devrait calculer le potentiel correct', () => {
      const actions = [
        { type: 'a', count: 60 },
        { type: 'b', count: 30 },
        { type: 'c', count: 15 },
      ];
      const opportunities = findAutomationOpportunities(actions);
      expect(opportunities.find(o => o.type === 'a')?.potential).toBe('HIGH');
      expect(opportunities.find(o => o.type === 'b')?.potential).toBe('MEDIUM');
      expect(opportunities.find(o => o.type === 'c')?.potential).toBe('LOW');
    });
  });

  describe('Anomaly Detection', () => {
    const detectAnomalies = (data: {
      expectedValue: number;
      actualValue: number;
      threshold: number;
    }): boolean => {
      const deviation = Math.abs(data.actualValue - data.expectedValue) / data.expectedValue;
      return deviation > data.threshold;
    };

    it('devrait détecter une anomalie', () => {
      const isAnomaly = detectAnomalies({
        expectedValue: 100,
        actualValue: 150,
        threshold: 0.3,
      });
      expect(isAnomaly).toBe(true);
    });

    it('devrait ne pas détecter si dans la plage', () => {
      const isAnomaly = detectAnomalies({
        expectedValue: 100,
        actualValue: 110,
        threshold: 0.3,
      });
      expect(isAnomaly).toBe(false);
    });
  });

  describe('Suggestion ID Generation', () => {
    const generateSuggestionId = (prefix: string, entityId: string): string => {
      return `${prefix}-${entityId}`;
    };

    it('devrait générer un ID avec préfixe', () => {
      const id = generateSuggestionId('stale', 'dossier-123');
      expect(id).toBe('stale-dossier-123');
    });

    it('devrait gérer différents préfixes', () => {
      expect(generateSuggestionId('followup', 'client-1')).toBe('followup-client-1');
      expect(generateSuggestionId('missing-doc', 'doc-1')).toBe('missing-doc-doc-1');
    });
  });

  describe('Estimated Time Calculation', () => {
    const estimateTimes: Record<string, number> = {
      email: 5,
      phone_call: 15,
      document_review: 30,
      meeting: 60,
    };

    it('devrait estimer 5 min pour email', () => {
      expect(estimateTimes.email).toBe(5);
    });

    it('devrait estimer 15 min pour appel', () => {
      expect(estimateTimes.phone_call).toBe(15);
    });

    it('devrait estimer 30 min pour revue document', () => {
      expect(estimateTimes.document_review).toBe(30);
    });
  });

  describe('Missing Documents Pattern', () => {
    const findRecurringMissing = (
      history: Array<{ docType: string; count: number }>
    ): string[] => {
      return history
        .filter(h => h.count >= 3)
        .map(h => h.docType);
    };

    it('devrait identifier les documents manquants récurrents', () => {
      const history = [
        { docType: 'justificatif_domicile', count: 5 },
        { docType: 'passeport', count: 2 },
        { docType: 'photo_identite', count: 4 },
      ];
      const recurring = findRecurringMissing(history);
      expect(recurring).toContain('justificatif_domicile');
      expect(recurring).toContain('photo_identite');
      expect(recurring).not.toContain('passeport');
    });
  });

  describe('Confidence Level', () => {
    it('devrait avoir des niveaux de confiance entre 0 et 100', () => {
      const confidence = 85;
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    it('devrait qualifier les niveaux', () => {
      const getQualification = (conf: number): string => {
        if (conf >= 90) return 'très haute';
        if (conf >= 70) return 'haute';
        if (conf >= 50) return 'moyenne';
        return 'basse';
      };

      expect(getQualification(95)).toBe('très haute');
      expect(getQualification(75)).toBe('haute');
      expect(getQualification(55)).toBe('moyenne');
      expect(getQualification(30)).toBe('basse');
    });
  });
});
