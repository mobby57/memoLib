/**
 * Tests pour types/cesda.ts - Types et constantes CESDA
 * Tests des enums, constantes et configurations CESDA
 */

import {
  ProcedureType,
  PROCEDURE_LABELS,
  PROCEDURE_COLORS,
  WorkspaceStatus,
  UrgencyLevel,
  URGENCY_COLORS,
  DocumentType,
  ChecklistCategory,
  AlertLevel,
  TimelineEventType,
  ActorType,
  DraftType,
  DraftStatus,
  AlertType,
  STANDARD_DEADLINES,
  CHECKLIST_TEMPLATES,
} from '@/types/cesda';

describe('types/cesda - Types et constantes CESDA', () => {
  
  // ============================================
  // ProcedureType Enum
  // ============================================
  describe('ProcedureType', () => {
    test('contient OQTF', () => {
      expect(ProcedureType.OQTF).toBe('OQTF');
    });

    test('contient REFUS_TITRE', () => {
      expect(ProcedureType.REFUS_TITRE).toBe('REFUS_TITRE');
    });

    test('contient RETRAIT_TITRE', () => {
      expect(ProcedureType.RETRAIT_TITRE).toBe('RETRAIT_TITRE');
    });

    test('contient ASILE', () => {
      expect(ProcedureType.ASILE).toBe('ASILE');
    });

    test('contient REGROUPEMENT_FAMILIAL', () => {
      expect(ProcedureType.REGROUPEMENT_FAMILIAL).toBe('REGROUPEMENT_FAMILIAL');
    });

    test('contient NATURALISATION', () => {
      expect(ProcedureType.NATURALISATION).toBe('NATURALISATION');
    });

    test('a 6 types de procédures', () => {
      const types = Object.values(ProcedureType);
      expect(types.length).toBe(6);
    });
  });

  // ============================================
  // PROCEDURE_LABELS
  // ============================================
  describe('PROCEDURE_LABELS', () => {
    test('contient un label pour chaque type', () => {
      Object.values(ProcedureType).forEach(type => {
        expect(PROCEDURE_LABELS[type]).toBeDefined();
        expect(typeof PROCEDURE_LABELS[type]).toBe('string');
      });
    });

    test('OQTF label contient "OQTF"', () => {
      expect(PROCEDURE_LABELS[ProcedureType.OQTF]).toContain('OQTF');
    });

    test('ASILE label contient "Asile"', () => {
      expect(PROCEDURE_LABELS[ProcedureType.ASILE]).toContain('Asile');
    });

    test('NATURALISATION label contient "Naturalisation"', () => {
      expect(PROCEDURE_LABELS[ProcedureType.NATURALISATION]).toContain('Naturalisation');
    });
  });

  // ============================================
  // PROCEDURE_COLORS
  // ============================================
  describe('PROCEDURE_COLORS', () => {
    test('contient une couleur pour chaque type', () => {
      Object.values(ProcedureType).forEach(type => {
        expect(PROCEDURE_COLORS[type]).toBeDefined();
        expect(PROCEDURE_COLORS[type]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    test('OQTF a une couleur rouge', () => {
      // #B91C1C is a red color
      expect(PROCEDURE_COLORS[ProcedureType.OQTF]).toBe('#B91C1C');
    });

    test('toutes les couleurs sont des hex valides', () => {
      Object.values(PROCEDURE_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  // ============================================
  // WorkspaceStatus Enum
  // ============================================
  describe('WorkspaceStatus', () => {
    test('contient ACTIVE', () => {
      expect(WorkspaceStatus.ACTIVE).toBe('active');
    });

    test('contient PENDING', () => {
      expect(WorkspaceStatus.PENDING).toBe('pending');
    });

    test('contient CLOSED', () => {
      expect(WorkspaceStatus.CLOSED).toBe('closed');
    });

    test('contient ARCHIVED', () => {
      expect(WorkspaceStatus.ARCHIVED).toBe('archived');
    });

    test('a 4 statuts', () => {
      expect(Object.values(WorkspaceStatus).length).toBe(4);
    });
  });

  // ============================================
  // UrgencyLevel Enum
  // ============================================
  describe('UrgencyLevel', () => {
    test('contient FAIBLE', () => {
      expect(UrgencyLevel.FAIBLE).toBe('faible');
    });

    test('contient MOYEN', () => {
      expect(UrgencyLevel.MOYEN).toBe('moyen');
    });

    test('contient ELEVE', () => {
      expect(UrgencyLevel.ELEVE).toBe('eleve');
    });

    test('contient CRITIQUE', () => {
      expect(UrgencyLevel.CRITIQUE).toBe('critique');
    });

    test('a 4 niveaux', () => {
      expect(Object.values(UrgencyLevel).length).toBe(4);
    });
  });

  // ============================================
  // URGENCY_COLORS
  // ============================================
  describe('URGENCY_COLORS', () => {
    test('contient une couleur pour chaque niveau', () => {
      Object.values(UrgencyLevel).forEach(level => {
        expect(URGENCY_COLORS[level]).toBeDefined();
      });
    });

    test('CRITIQUE a une couleur rouge', () => {
      expect(URGENCY_COLORS[UrgencyLevel.CRITIQUE]).toBe('#DC2626');
    });

    test('FAIBLE a une couleur verte', () => {
      expect(URGENCY_COLORS[UrgencyLevel.FAIBLE]).toBe('#10B981');
    });

    test('toutes les couleurs sont des hex valides', () => {
      Object.values(URGENCY_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  // ============================================
  // DocumentType Enum
  // ============================================
  describe('DocumentType', () => {
    test('contient DECISION_ADMINISTRATIVE', () => {
      expect(DocumentType.DECISION_ADMINISTRATIVE).toBe('decision_administrative');
    });

    test('contient PASSEPORT', () => {
      expect(DocumentType.PASSEPORT).toBe('passeport');
    });

    test('contient JUSTIFICATIF_DOMICILE', () => {
      expect(DocumentType.JUSTIFICATIF_DOMICILE).toBe('justificatif_domicile');
    });

    test('contient AUTRE', () => {
      expect(DocumentType.AUTRE).toBe('autre');
    });

    test('a au moins 10 types de documents', () => {
      expect(Object.values(DocumentType).length).toBeGreaterThanOrEqual(10);
    });
  });

  // ============================================
  // ChecklistCategory Enum
  // ============================================
  describe('ChecklistCategory', () => {
    test('contient VERIFICATIONS', () => {
      expect(ChecklistCategory.VERIFICATIONS).toBe('verifications');
    });

    test('contient PIECES', () => {
      expect(ChecklistCategory.PIECES).toBe('pieces');
    });

    test('contient ACTIONS', () => {
      expect(ChecklistCategory.ACTIONS).toBe('actions');
    });

    test('a 3 catégories', () => {
      expect(Object.values(ChecklistCategory).length).toBe(3);
    });
  });

  // ============================================
  // AlertLevel Enum
  // ============================================
  describe('AlertLevel', () => {
    test('contient INFO', () => {
      expect(AlertLevel.INFO).toBe('info');
    });

    test('contient WARNING', () => {
      expect(AlertLevel.WARNING).toBe('warning');
    });

    test('contient CRITICAL', () => {
      expect(AlertLevel.CRITICAL).toBe('critical');
    });

    test('a 3 niveaux', () => {
      expect(Object.values(AlertLevel).length).toBe(3);
    });
  });

  // ============================================
  // TimelineEventType Enum
  // ============================================
  describe('TimelineEventType', () => {
    test('contient CREATED', () => {
      expect(TimelineEventType.CREATED).toBe('created');
    });

    test('contient DOCUMENT_ADDED', () => {
      expect(TimelineEventType.DOCUMENT_ADDED).toBe('document_added');
    });

    test('contient AI_SUGGESTION', () => {
      expect(TimelineEventType.AI_SUGGESTION).toBe('ai_suggestion');
    });

    test('contient HUMAN_VALIDATION', () => {
      expect(TimelineEventType.HUMAN_VALIDATION).toBe('human_validation');
    });

    test('a au moins 10 types d\'événements', () => {
      expect(Object.values(TimelineEventType).length).toBeGreaterThanOrEqual(10);
    });
  });

  // ============================================
  // ActorType Enum
  // ============================================
  describe('ActorType', () => {
    test('contient USER', () => {
      expect(ActorType.USER).toBe('user');
    });

    test('contient AI', () => {
      expect(ActorType.AI).toBe('ai');
    });

    test('contient SYSTEM', () => {
      expect(ActorType.SYSTEM).toBe('system');
    });

    test('a 3 types d\'acteurs', () => {
      expect(Object.values(ActorType).length).toBe(3);
    });
  });

  // ============================================
  // DraftType Enum
  // ============================================
  describe('DraftType', () => {
    test('contient RECOURS_CONTENTIEUX', () => {
      expect(DraftType.RECOURS_CONTENTIEUX).toBe('recours_contentieux');
    });

    test('contient RECOURS_GRACIEUX', () => {
      expect(DraftType.RECOURS_GRACIEUX).toBe('recours_gracieux');
    });

    test('contient MEMOIRE', () => {
      expect(DraftType.MEMOIRE).toBe('memoire');
    });

    test('a au moins 5 types de brouillons', () => {
      expect(Object.values(DraftType).length).toBeGreaterThanOrEqual(5);
    });
  });

  // ============================================
  // DraftStatus Enum
  // ============================================
  describe('DraftStatus', () => {
    test('contient DRAFT', () => {
      expect(DraftStatus.DRAFT).toBe('draft');
    });

    test('contient REVIEWED', () => {
      expect(DraftStatus.REVIEWED).toBe('reviewed');
    });

    test('contient APPROVED', () => {
      expect(DraftStatus.APPROVED).toBe('approved');
    });

    test('contient REJECTED', () => {
      expect(DraftStatus.REJECTED).toBe('rejected');
    });

    test('a 4 statuts', () => {
      expect(Object.values(DraftStatus).length).toBe(4);
    });
  });

  // ============================================
  // AlertType Enum
  // ============================================
  describe('AlertType', () => {
    test('contient DEADLINE_CRITICAL', () => {
      expect(AlertType.DEADLINE_CRITICAL).toBe('deadline_critical');
    });

    test('contient DOCUMENT_MISSING', () => {
      expect(AlertType.DOCUMENT_MISSING).toBe('document_missing');
    });

    test('contient AI_LOW_CONFIDENCE', () => {
      expect(AlertType.AI_LOW_CONFIDENCE).toBe('ai_low_confidence');
    });

    test('a au moins 5 types d\'alertes', () => {
      expect(Object.values(AlertType).length).toBeGreaterThanOrEqual(5);
    });
  });

  // ============================================
  // STANDARD_DEADLINES
  // ============================================
  describe('STANDARD_DEADLINES', () => {
    test('contient OQTF_SANS_DELAI', () => {
      expect(STANDARD_DEADLINES.OQTF_SANS_DELAI).toBeDefined();
      expect(STANDARD_DEADLINES.OQTF_SANS_DELAI.defaultHours).toBe(48);
    });

    test('contient OQTF_AVEC_DELAI', () => {
      expect(STANDARD_DEADLINES.OQTF_AVEC_DELAI).toBeDefined();
      expect(STANDARD_DEADLINES.OQTF_AVEC_DELAI.defaultDays).toBe(30);
    });

    test('contient REFUS_TITRE', () => {
      expect(STANDARD_DEADLINES.REFUS_TITRE).toBeDefined();
      expect(STANDARD_DEADLINES.REFUS_TITRE.defaultDays).toBe(60);
    });

    test('contient ASILE_CNDA', () => {
      expect(STANDARD_DEADLINES.ASILE_CNDA).toBeDefined();
      expect(STANDARD_DEADLINES.ASILE_CNDA.defaultDays).toBe(30);
    });

    test('tous les délais ont calculateFrom', () => {
      Object.values(STANDARD_DEADLINES).forEach(deadline => {
        expect(deadline.calculateFrom).toBeDefined();
        expect(['notification', 'decision', 'reception']).toContain(deadline.calculateFrom);
      });
    });

    test('tous les délais ont workingDays défini', () => {
      Object.values(STANDARD_DEADLINES).forEach(deadline => {
        expect(typeof deadline.workingDays).toBe('boolean');
      });
    });
  });

  // ============================================
  // CHECKLIST_TEMPLATES
  // ============================================
  describe('CHECKLIST_TEMPLATES', () => {
    test('contient un template pour OQTF', () => {
      expect(CHECKLIST_TEMPLATES[ProcedureType.OQTF]).toBeDefined();
      expect(CHECKLIST_TEMPLATES[ProcedureType.OQTF].procedureType).toBe(ProcedureType.OQTF);
    });

    test('les templates ont des items', () => {
      Object.values(CHECKLIST_TEMPLATES).forEach(template => {
        expect(template.items).toBeDefined();
        expect(Array.isArray(template.items)).toBe(true);
        expect(template.items.length).toBeGreaterThan(0);
      });
    });

    test('les items ont les propriétés requises', () => {
      const oqtfTemplate = CHECKLIST_TEMPLATES[ProcedureType.OQTF];
      oqtfTemplate.items.forEach(item => {
        expect(item.category).toBeDefined();
        expect(item.label).toBeDefined();
        expect(typeof item.required).toBe('boolean');
        expect(typeof item.order).toBe('number');
      });
    });

    test('les items utilisent les catégories valides', () => {
      const validCategories = Object.values(ChecklistCategory);
      Object.values(CHECKLIST_TEMPLATES).forEach(template => {
        template.items.forEach(item => {
          expect(validCategories).toContain(item.category);
        });
      });
    });
  });
});
