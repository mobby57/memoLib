/**
 * Tests pour types/workspace-reasoning.ts - Système de raisonnement Workspace
 * Tests des constantes, états, et fonctions de validation
 */

import {
  WORKSPACE_STATES,
  STRUCTURAL_RULES,
  ALLOWED_TRANSITIONS,
  getStateBadgeColor,
  canTransitionTo,
  formatUncertaintyLevel,
  calculateRiskScore,
  canTransitionToReadyForHuman,
  calculateUncertaintyLevel,
  validateFactHasSource,
  validateObligationHasContext,
  validateStateTransition,
  getRiskColor,
  type WorkspaceState,
  type Fact,
  type Obligation,
  type MissingElement,
  type Risk,
} from '@/types/workspace-reasoning';

describe('workspace-reasoning - Système de raisonnement', () => {
  
  // ============================================
  // WORKSPACE_STATES
  // ============================================
  describe('WORKSPACE_STATES', () => {
    const allStates: WorkspaceState[] = [
      'RECEIVED',
      'FACTS_EXTRACTED',
      'CONTEXT_IDENTIFIED',
      'OBLIGATIONS_DEDUCED',
      'MISSING_IDENTIFIED',
      'RISK_EVALUATED',
      'ACTION_PROPOSED',
      'READY_FOR_HUMAN'
    ];

    test('contient tous les 8 états', () => {
      expect(Object.keys(WORKSPACE_STATES)).toHaveLength(8);
    });

    test.each(allStates)('état %s a un label', (state) => {
      expect(WORKSPACE_STATES[state].label).toBeDefined();
      expect(WORKSPACE_STATES[state].label.length).toBeGreaterThan(0);
    });

    test.each(allStates)('état %s a une couleur', (state) => {
      expect(WORKSPACE_STATES[state].color).toBeDefined();
    });

    test.each(allStates)('état %s a une icône', (state) => {
      expect(WORKSPACE_STATES[state].icon).toBeDefined();
    });

    test('RECEIVED a le label "Recu"', () => {
      expect(WORKSPACE_STATES.RECEIVED.label).toBe('Recu');
    });

    test('READY_FOR_HUMAN a le label correct', () => {
      expect(WORKSPACE_STATES.READY_FOR_HUMAN.label).toBe('Pret pour humain');
    });
  });

  // ============================================
  // STRUCTURAL_RULES
  // ============================================
  describe('STRUCTURAL_RULES', () => {
    test('WORKSPACE_REQUIRED est définie', () => {
      expect(STRUCTURAL_RULES.WORKSPACE_REQUIRED).toBeDefined();
      expect(typeof STRUCTURAL_RULES.WORKSPACE_REQUIRED).toBe('string');
    });

    test('FACT_SOURCE_REQUIRED est définie', () => {
      expect(STRUCTURAL_RULES.FACT_SOURCE_REQUIRED).toBeDefined();
    });

    test('OBLIGATION_CONTEXT_REQUIRED est définie', () => {
      expect(STRUCTURAL_RULES.OBLIGATION_CONTEXT_REQUIRED).toBeDefined();
    });

    test('ACTION_MISSING_REQUIRED est définie', () => {
      expect(STRUCTURAL_RULES.ACTION_MISSING_REQUIRED).toBeDefined();
    });

    test('NO_READY_WITH_BLOCKING est définie', () => {
      expect(STRUCTURAL_RULES.NO_READY_WITH_BLOCKING).toBeDefined();
    });

    test('contient 5 règles structurelles', () => {
      expect(Object.keys(STRUCTURAL_RULES)).toHaveLength(5);
    });
  });

  // ============================================
  // ALLOWED_TRANSITIONS
  // ============================================
  describe('ALLOWED_TRANSITIONS', () => {
    test('RECEIVED peut aller vers FACTS_EXTRACTED', () => {
      expect(ALLOWED_TRANSITIONS.RECEIVED).toContain('FACTS_EXTRACTED');
    });

    test('FACTS_EXTRACTED peut aller vers CONTEXT_IDENTIFIED', () => {
      expect(ALLOWED_TRANSITIONS.FACTS_EXTRACTED).toContain('CONTEXT_IDENTIFIED');
    });

    test('ACTION_PROPOSED peut aller vers READY_FOR_HUMAN', () => {
      expect(ALLOWED_TRANSITIONS.ACTION_PROPOSED).toContain('READY_FOR_HUMAN');
    });

    test('READY_FOR_HUMAN est un état terminal (aucune transition)', () => {
      expect(ALLOWED_TRANSITIONS.READY_FOR_HUMAN).toHaveLength(0);
    });

    test('chaque état n\'a qu\'une seule transition possible (sauf terminal)', () => {
      const states = Object.keys(ALLOWED_TRANSITIONS) as WorkspaceState[];
      states.forEach(state => {
        if (state !== 'READY_FOR_HUMAN') {
          expect(ALLOWED_TRANSITIONS[state].length).toBe(1);
        }
      });
    });
  });

  // ============================================
  // getStateBadgeColor
  // ============================================
  describe('getStateBadgeColor', () => {
    test('retourne les classes CSS pour RECEIVED', () => {
      expect(getStateBadgeColor('RECEIVED')).toBe('bg-gray-100 text-gray-800');
    });

    test('retourne les classes CSS pour FACTS_EXTRACTED', () => {
      expect(getStateBadgeColor('FACTS_EXTRACTED')).toBe('bg-blue-100 text-blue-800');
    });

    test('retourne les classes CSS pour READY_FOR_HUMAN', () => {
      expect(getStateBadgeColor('READY_FOR_HUMAN')).toBe('bg-green-100 text-green-800');
    });

    test.each([
      ['RECEIVED', 'gray'],
      ['FACTS_EXTRACTED', 'blue'],
      ['CONTEXT_IDENTIFIED', 'purple'],
      ['OBLIGATIONS_DEDUCED', 'orange'],
      ['MISSING_IDENTIFIED', 'red'],
      ['RISK_EVALUATED', 'yellow'],
      ['ACTION_PROPOSED', 'indigo'],
      ['READY_FOR_HUMAN', 'green'],
    ] as [WorkspaceState, string][])('état %s contient la couleur %s', (state, colorName) => {
      const color = getStateBadgeColor(state);
      expect(color).toContain(colorName);
    });
  });

  // ============================================
  // canTransitionTo
  // ============================================
  describe('canTransitionTo', () => {
    test('RECEIVED peut aller à FACTS_EXTRACTED', () => {
      expect(canTransitionTo('RECEIVED', 'FACTS_EXTRACTED')).toBe(true);
    });

    test('RECEIVED ne peut pas aller à READY_FOR_HUMAN', () => {
      expect(canTransitionTo('RECEIVED', 'READY_FOR_HUMAN')).toBe(false);
    });

    test('FACTS_EXTRACTED ne peut pas retourner à RECEIVED', () => {
      expect(canTransitionTo('FACTS_EXTRACTED', 'RECEIVED')).toBe(false);
    });

    test('ACTION_PROPOSED peut aller à READY_FOR_HUMAN', () => {
      expect(canTransitionTo('ACTION_PROPOSED', 'READY_FOR_HUMAN')).toBe(true);
    });

    test('READY_FOR_HUMAN ne peut aller nulle part', () => {
      expect(canTransitionTo('READY_FOR_HUMAN', 'RECEIVED')).toBe(false);
      expect(canTransitionTo('READY_FOR_HUMAN', 'FACTS_EXTRACTED')).toBe(false);
    });

    test('transitions en séquence complète', () => {
      expect(canTransitionTo('RECEIVED', 'FACTS_EXTRACTED')).toBe(true);
      expect(canTransitionTo('FACTS_EXTRACTED', 'CONTEXT_IDENTIFIED')).toBe(true);
      expect(canTransitionTo('CONTEXT_IDENTIFIED', 'OBLIGATIONS_DEDUCED')).toBe(true);
      expect(canTransitionTo('OBLIGATIONS_DEDUCED', 'MISSING_IDENTIFIED')).toBe(true);
      expect(canTransitionTo('MISSING_IDENTIFIED', 'RISK_EVALUATED')).toBe(true);
      expect(canTransitionTo('RISK_EVALUATED', 'ACTION_PROPOSED')).toBe(true);
      expect(canTransitionTo('ACTION_PROPOSED', 'READY_FOR_HUMAN')).toBe(true);
    });
  });

  // ============================================
  // formatUncertaintyLevel
  // ============================================
  describe('formatUncertaintyLevel', () => {
    test('niveau >= 0.8 = "Tres incertain" en rouge', () => {
      const result = formatUncertaintyLevel(0.8);
      expect(result.label).toBe('Tres incertain');
      expect(result.color).toContain('red');
    });

    test('niveau 0.9 = "Tres incertain"', () => {
      expect(formatUncertaintyLevel(0.9).label).toBe('Tres incertain');
    });

    test('niveau 0.5 = "Incertain" en orange', () => {
      const result = formatUncertaintyLevel(0.5);
      expect(result.label).toBe('Incertain');
      expect(result.color).toContain('orange');
    });

    test('niveau 0.7 = "Incertain"', () => {
      expect(formatUncertaintyLevel(0.7).label).toBe('Incertain');
    });

    test('niveau 0.2 = "Peu incertain" en jaune', () => {
      const result = formatUncertaintyLevel(0.2);
      expect(result.label).toBe('Peu incertain');
      expect(result.color).toContain('yellow');
    });

    test('niveau 0.4 = "Peu incertain"', () => {
      expect(formatUncertaintyLevel(0.4).label).toBe('Peu incertain');
    });

    test('niveau < 0.2 = "Actionnable" en vert', () => {
      const result = formatUncertaintyLevel(0.1);
      expect(result.label).toBe('Actionnable');
      expect(result.color).toContain('green');
    });

    test('niveau 0 = "Actionnable"', () => {
      expect(formatUncertaintyLevel(0).label).toBe('Actionnable');
    });
  });

  // ============================================
  // calculateRiskScore
  // ============================================
  describe('calculateRiskScore', () => {
    test('LOW/LOW = 1', () => {
      expect(calculateRiskScore('LOW', 'LOW')).toBe(1);
    });

    test('LOW/MEDIUM = 2', () => {
      expect(calculateRiskScore('LOW', 'MEDIUM')).toBe(2);
    });

    test('MEDIUM/MEDIUM = 4', () => {
      expect(calculateRiskScore('MEDIUM', 'MEDIUM')).toBe(4);
    });

    test('HIGH/HIGH = 9', () => {
      expect(calculateRiskScore('HIGH', 'HIGH')).toBe(9);
    });

    test('HIGH/LOW = 3', () => {
      expect(calculateRiskScore('HIGH', 'LOW')).toBe(3);
    });

    test('LOW/HIGH = 3', () => {
      expect(calculateRiskScore('LOW', 'HIGH')).toBe(3);
    });

    test('MEDIUM/HIGH = 6', () => {
      expect(calculateRiskScore('MEDIUM', 'HIGH')).toBe(6);
    });
  });

  // ============================================
  // canTransitionToReadyForHuman
  // ============================================
  describe('canTransitionToReadyForHuman', () => {
    test('retourne true si aucun élément manquant', () => {
      expect(canTransitionToReadyForHuman([])).toBe(true);
    });

    test('retourne true si tous les éléments sont résolus', () => {
      const elements: MissingElement[] = [
        { id: '1', workspaceId: 'w1', type: 'document', description: 'test', priority: 'high', resolved: true, createdAt: new Date(), updatedAt: new Date() },
      ];
      expect(canTransitionToReadyForHuman(elements)).toBe(true);
    });

    test('retourne false si élément bloquant non résolu', () => {
      const elements: MissingElement[] = [
        { id: '1', workspaceId: 'w1', type: 'document', description: 'test', priority: 'normal', blocking: true, resolved: false, createdAt: new Date(), updatedAt: new Date() },
      ];
      expect(canTransitionToReadyForHuman(elements)).toBe(false);
    });

    test('retourne false si priorité urgent non résolue', () => {
      const elements: MissingElement[] = [
        { id: '1', workspaceId: 'w1', type: 'document', description: 'test', priority: 'urgent', resolved: false, createdAt: new Date(), updatedAt: new Date() },
      ];
      expect(canTransitionToReadyForHuman(elements)).toBe(false);
    });

    test('retourne false si priorité high non résolue', () => {
      const elements: MissingElement[] = [
        { id: '1', workspaceId: 'w1', type: 'document', description: 'test', priority: 'high', resolved: false, createdAt: new Date(), updatedAt: new Date() },
      ];
      expect(canTransitionToReadyForHuman(elements)).toBe(false);
    });

    test('retourne true si priorité normal non résolue (non bloquant)', () => {
      const elements: MissingElement[] = [
        { id: '1', workspaceId: 'w1', type: 'document', description: 'test', priority: 'normal', resolved: false, createdAt: new Date(), updatedAt: new Date() },
      ];
      expect(canTransitionToReadyForHuman(elements)).toBe(true);
    });
  });

  // ============================================
  // calculateUncertaintyLevel
  // ============================================
  describe('calculateUncertaintyLevel', () => {
    test('retourne 1.0 si aucun fait', () => {
      expect(calculateUncertaintyLevel(0, 5, 2)).toBe(1.0);
    });

    test('retourne 0 si aucun manque et aucun risque', () => {
      expect(calculateUncertaintyLevel(10, 0, 0)).toBe(0);
    });

    test('plus de faits = moins d\'incertitude', () => {
      const level1 = calculateUncertaintyLevel(5, 5, 0);
      const level2 = calculateUncertaintyLevel(10, 5, 0);
      expect(level2).toBeLessThan(level1);
    });

    test('plus de manques = plus d\'incertitude', () => {
      const level1 = calculateUncertaintyLevel(10, 2, 0);
      const level2 = calculateUncertaintyLevel(10, 5, 0);
      expect(level2).toBeGreaterThan(level1);
    });

    test('les risques augmentent l\'incertitude', () => {
      const level1 = calculateUncertaintyLevel(10, 2, 0);
      const level2 = calculateUncertaintyLevel(10, 2, 3);
      expect(level2).toBeGreaterThan(level1);
    });

    test('ne dépasse jamais 1.0', () => {
      expect(calculateUncertaintyLevel(1, 100, 100)).toBeLessThanOrEqual(1.0);
    });

    test('impact des risques plafonné à 0.5', () => {
      const withManyRisks = calculateUncertaintyLevel(10, 0, 100);
      expect(withManyRisks).toBeLessThanOrEqual(0.5);
    });
  });

  // ============================================
  // validateFactHasSource
  // ============================================
  describe('validateFactHasSource', () => {
    test('retourne true si source présente', () => {
      const fact: Partial<Fact> = {
        source: 'EXPLICIT_MESSAGE',
      };
      expect(validateFactHasSource(fact as Fact)).toBe(true);
    });

    test('retourne false si source vide', () => {
      const fact: Partial<Fact> = {
        source: '' as any,
      };
      expect(validateFactHasSource(fact as Fact)).toBe(false);
    });

    test('retourne false si source undefined', () => {
      const fact = {} as Fact;
      expect(validateFactHasSource(fact)).toBe(false);
    });

    test.each(['EXPLICIT_MESSAGE', 'METADATA', 'DOCUMENT', 'USER_PROVIDED'] as const)(
      'accepte la source %s',
      (source) => {
        const fact: Partial<Fact> = { source };
        expect(validateFactHasSource(fact as Fact)).toBe(true);
      }
    );
  });

  // ============================================
  // validateObligationHasContext
  // ============================================
  describe('validateObligationHasContext', () => {
    test('retourne true si contextId présent', () => {
      const obligation: Partial<Obligation> = {
        contextId: 'ctx-123',
      };
      expect(validateObligationHasContext(obligation as Obligation)).toBe(true);
    });

    test('retourne false si contextId vide', () => {
      const obligation: Partial<Obligation> = {
        contextId: '',
      };
      expect(validateObligationHasContext(obligation as Obligation)).toBe(false);
    });

    test('retourne false si contextId undefined', () => {
      const obligation = {} as Obligation;
      expect(validateObligationHasContext(obligation)).toBe(false);
    });
  });

  // ============================================
  // validateStateTransition
  // ============================================
  describe('validateStateTransition', () => {
    test('transition valide RECEIVED → FACTS_EXTRACTED', () => {
      const result = validateStateTransition('RECEIVED', 'FACTS_EXTRACTED');
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test('transition invalide RECEIVED → READY_FOR_HUMAN', () => {
      const result = validateStateTransition('RECEIVED', 'READY_FOR_HUMAN');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not allowed');
    });

    test('transition ACTION_PROPOSED → READY_FOR_HUMAN sans éléments bloquants', () => {
      const elements: MissingElement[] = [];
      const result = validateStateTransition('ACTION_PROPOSED', 'READY_FOR_HUMAN', elements);
      expect(result.valid).toBe(true);
    });

    test('transition ACTION_PROPOSED → READY_FOR_HUMAN avec élément bloquant', () => {
      const elements: MissingElement[] = [
        { id: '1', workspaceId: 'w1', type: 'doc', description: 'test', priority: 'urgent', resolved: false, createdAt: new Date(), updatedAt: new Date() },
      ];
      const result = validateStateTransition('ACTION_PROPOSED', 'READY_FOR_HUMAN', elements);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe(STRUCTURAL_RULES.NO_READY_WITH_BLOCKING);
    });
  });

  // ============================================
  // getRiskColor
  // ============================================
  describe('getRiskColor', () => {
    test('score >= 6 = rouge', () => {
      expect(getRiskColor(6)).toContain('red');
      expect(getRiskColor(9)).toContain('red');
    });

    test('score >= 4 et < 6 = orange', () => {
      expect(getRiskColor(4)).toContain('orange');
      expect(getRiskColor(5)).toContain('orange');
    });

    test('score < 4 = jaune', () => {
      expect(getRiskColor(1)).toContain('yellow');
      expect(getRiskColor(3)).toContain('yellow');
    });
  });

  // ============================================
  // Tests d'intégration du workflow
  // ============================================
  describe('Workflow complet', () => {
    test('un workspace peut traverser tous les états', () => {
      const states: WorkspaceState[] = [
        'RECEIVED',
        'FACTS_EXTRACTED',
        'CONTEXT_IDENTIFIED',
        'OBLIGATIONS_DEDUCED',
        'MISSING_IDENTIFIED',
        'RISK_EVALUATED',
        'ACTION_PROPOSED',
        'READY_FOR_HUMAN'
      ];

      for (let i = 0; i < states.length - 1; i++) {
        expect(canTransitionTo(states[i], states[i + 1])).toBe(true);
      }
    });

    test('chaque état a un badge color valide', () => {
      const states: WorkspaceState[] = [
        'RECEIVED',
        'FACTS_EXTRACTED',
        'CONTEXT_IDENTIFIED',
        'OBLIGATIONS_DEDUCED',
        'MISSING_IDENTIFIED',
        'RISK_EVALUATED',
        'ACTION_PROPOSED',
        'READY_FOR_HUMAN'
      ];

      states.forEach(state => {
        const color = getStateBadgeColor(state);
        expect(color).toMatch(/^bg-\w+-100 text-\w+-800$/);
      });
    });
  });
});
