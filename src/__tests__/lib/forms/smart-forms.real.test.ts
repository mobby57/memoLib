/**
 * Tests pour formConfigs.ts - Configurations de formulaires v2
 * Tests des formulaires intelligents
 */

import {
  resourceRequestForm,
  strategicDecisionForm,
  riskAssessmentForm,
  formConfigs,
} from '@/lib/forms/formConfigs';

describe('formConfigs - Formulaires intelligents v2', () => {
  
  // ============================================
  // resourceRequestForm
  // ============================================
  describe('resourceRequestForm', () => {
    test('a un ID unique', () => {
      expect(resourceRequestForm.id).toBe('resource-request');
    });

    test('a un titre et description', () => {
      expect(resourceRequestForm.title).toBe('Demande de Ressources');
      expect(resourceRequestForm.description).toContain('ressources');
    });

    test('est de catégorie resource', () => {
      expect(resourceRequestForm.category).toBe('resource');
    });

    test('a l\'IA activée', () => {
      expect(resourceRequestForm.aiEnabled).toBe(true);
    });

    test('requiert une approbation', () => {
      expect(resourceRequestForm.requiresApproval).toBe(true);
    });

    test('a des approbateurs définis', () => {
      expect(resourceRequestForm.approvers).toBeDefined();
      expect(Array.isArray(resourceRequestForm.approvers)).toBe(true);
      expect(resourceRequestForm.approvers!.length).toBeGreaterThan(0);
    });

    test('inclut Directeur et RH Manager comme approbateurs', () => {
      expect(resourceRequestForm.approvers).toContain('Directeur');
      expect(resourceRequestForm.approvers).toContain('RH Manager');
    });

    test('a un seuil d\'impact medium', () => {
      expect(resourceRequestForm.impactThreshold).toBe('medium');
    });

    test('contient des champs de formulaire', () => {
      expect(resourceRequestForm.fields).toBeDefined();
      expect(Array.isArray(resourceRequestForm.fields)).toBe(true);
      expect(resourceRequestForm.fields.length).toBeGreaterThan(0);
    });

    describe('champs du formulaire', () => {
      test('contient le champ resourceType', () => {
        const field = resourceRequestForm.fields.find(f => f.id === 'resourceType');
        expect(field).toBeDefined();
        expect(field!.type).toBe('select');
        expect(field!.required).toBe(true);
      });

      test('resourceType a des options avec impact', () => {
        const field = resourceRequestForm.fields.find(f => f.id === 'resourceType');
        expect(field!.options).toBeDefined();
        expect(field!.options!.length).toBe(4);
        field!.options!.forEach(opt => {
          expect(opt.value).toBeDefined();
          expect(opt.label).toBeDefined();
        });
      });

      test('contient le champ justification', () => {
        const field = resourceRequestForm.fields.find(f => f.id === 'justification');
        expect(field).toBeDefined();
        expect(field!.type).toBe('textarea');
        expect(field!.required).toBe(true);
      });

      test('contient le champ urgency', () => {
        const field = resourceRequestForm.fields.find(f => f.id === 'urgency');
        expect(field).toBeDefined();
        expect(field!.type).toBe('radio');
        expect(field!.options!.length).toBe(4);
      });

      test('urgency a une analyse d\'impact critique', () => {
        const field = resourceRequestForm.fields.find(f => f.id === 'urgency');
        expect(field!.impactAnalysis).toBeDefined();
        expect(field!.impactAnalysis!.level).toBe('critical');
      });

      test('contient le champ estimatedCost', () => {
        const field = resourceRequestForm.fields.find(f => f.id === 'estimatedCost');
        expect(field).toBeDefined();
        expect(field!.type).toBe('number');
        expect(field!.dependsOn).toBe('resourceType');
        expect(field!.dependsOnValue).toBe('budget');
      });

      test('contient le champ duration', () => {
        const field = resourceRequestForm.fields.find(f => f.id === 'duration');
        expect(field).toBeDefined();
        expect(field!.type).toBe('select');
        expect(field!.options!.length).toBe(3);
      });

      test('contient le champ alternatives (optionnel)', () => {
        const field = resourceRequestForm.fields.find(f => f.id === 'alternatives');
        expect(field).toBeDefined();
        expect(field!.type).toBe('textarea');
        expect(field!.required).toBeFalsy();
      });
    });

    test('a une fonction onSubmit', () => {
      expect(resourceRequestForm.onSubmit).toBeDefined();
      expect(typeof resourceRequestForm.onSubmit).toBe('function');
    });
  });

  // ============================================
  // strategicDecisionForm
  // ============================================
  describe('strategicDecisionForm', () => {
    test('a un ID unique', () => {
      expect(strategicDecisionForm.id).toBe('strategic-decision');
    });

    test('a un titre et description', () => {
      expect(strategicDecisionForm.title).toBe('Decision Strategique');
      expect(strategicDecisionForm.description).toContain('decision');
    });

    test('est de catégorie strategy', () => {
      expect(strategicDecisionForm.category).toBe('strategy');
    });

    test('a l\'IA activée', () => {
      expect(strategicDecisionForm.aiEnabled).toBe(true);
    });

    test('requiert une approbation', () => {
      expect(strategicDecisionForm.requiresApproval).toBe(true);
    });

    test('a des approbateurs de haut niveau', () => {
      expect(strategicDecisionForm.approvers).toContain('Associe principal');
      expect(strategicDecisionForm.approvers).toContain('Comite de direction');
    });

    test('a un seuil d\'impact high', () => {
      expect(strategicDecisionForm.impactThreshold).toBe('high');
    });

    describe('champs du formulaire', () => {
      test('contient le champ decisionTitle', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'decisionTitle');
        expect(field).toBeDefined();
        expect(field!.type).toBe('text');
        expect(field!.required).toBe(true);
      });

      test('contient le champ context', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'context');
        expect(field).toBeDefined();
        expect(field!.type).toBe('textarea');
        expect(field!.required).toBe(true);
      });

      test('contient le champ proposedSolution', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'proposedSolution');
        expect(field).toBeDefined();
        expect(field!.type).toBe('textarea');
        expect(field!.impactAnalysis).toBeDefined();
      });

      test('proposedSolution a une analyse d\'impact critique', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'proposedSolution');
        expect(field!.impactAnalysis!.level).toBe('critical');
      });

      test('contient le champ expectedImpact multiselect', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'expectedImpact');
        expect(field).toBeDefined();
        expect(field!.type).toBe('multiselect');
        expect(field!.options!.length).toBe(6);
      });

      test('expectedImpact couvre les domaines clés', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'expectedImpact');
        const values = field!.options!.map(o => o.value);
        expect(values).toContain('revenue');
        expect(values).toContain('costs');
        expect(values).toContain('team');
        expect(values).toContain('clients');
      });

      test('contient le champ risks', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'risks');
        expect(field).toBeDefined();
        expect(field!.required).toBe(true);
        expect(field!.impactAnalysis!.level).toBe('critical');
      });

      test('contient le champ timeline', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'timeline');
        expect(field).toBeDefined();
        expect(field!.type).toBe('text');
        expect(field!.required).toBe(true);
      });

      test('contient le champ kpis', () => {
        const field = strategicDecisionForm.fields.find(f => f.id === 'kpis');
        expect(field).toBeDefined();
        expect(field!.type).toBe('textarea');
        expect(field!.required).toBe(true);
      });
    });

    test('a une fonction onSubmit', () => {
      expect(strategicDecisionForm.onSubmit).toBeDefined();
    });
  });

  // ============================================
  // riskAssessmentForm
  // ============================================
  describe('riskAssessmentForm', () => {
    test('a un ID unique', () => {
      expect(riskAssessmentForm.id).toBe('risk-assessment');
    });

    test('a un titre et description', () => {
      expect(riskAssessmentForm.title).toContain('Risques');
      expect(riskAssessmentForm.description).toContain('risque');
    });

    test('est de catégorie risk', () => {
      expect(riskAssessmentForm.category).toBe('risk');
    });

    test('a l\'IA activée', () => {
      expect(riskAssessmentForm.aiEnabled).toBe(true);
    });

    test('ne requiert PAS d\'approbation', () => {
      expect(riskAssessmentForm.requiresApproval).toBe(false);
    });

    test('a un seuil d\'impact high', () => {
      expect(riskAssessmentForm.impactThreshold).toBe('high');
    });

    describe('champs du formulaire', () => {
      test('contient le champ riskCategory', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'riskCategory');
        expect(field).toBeDefined();
        expect(field!.type).toBe('select');
        expect(field!.required).toBe(true);
      });

      test('riskCategory couvre les catégories de risque', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'riskCategory');
        const values = field!.options!.map(o => o.value);
        expect(values).toContain('financial');
        expect(values).toContain('legal');
        expect(values).toContain('operational');
        expect(values).toContain('reputational');
        expect(values).toContain('strategic');
        expect(values).toContain('security');
      });

      test('contient le champ riskDescription', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'riskDescription');
        expect(field).toBeDefined();
        expect(field!.type).toBe('textarea');
        expect(field!.required).toBe(true);
      });

      test('contient le champ probability', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'probability');
        expect(field).toBeDefined();
        expect(field!.type).toBe('radio');
        expect(field!.options!.length).toBe(5);
      });

      test('probability a 5 niveaux', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'probability');
        const values = field!.options!.map(o => o.value);
        expect(values).toContain('very-low');
        expect(values).toContain('low');
        expect(values).toContain('medium');
        expect(values).toContain('high');
        expect(values).toContain('very-high');
      });

      test('contient le champ severity', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'severity');
        expect(field).toBeDefined();
        expect(field!.type).toBe('radio');
        expect(field!.impactAnalysis!.level).toBe('critical');
      });

      test('severity a 5 niveaux', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'severity');
        const values = field!.options!.map(o => o.value);
        expect(values).toContain('negligible');
        expect(values).toContain('minor');
        expect(values).toContain('moderate');
        expect(values).toContain('major');
        expect(values).toContain('critical');
      });

      test('contient le champ mitigationPlan', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'mitigationPlan');
        expect(field).toBeDefined();
        expect(field!.type).toBe('textarea');
        expect(field!.required).toBe(true);
      });

      test('contient le champ responsiblePerson', () => {
        const field = riskAssessmentForm.fields.find(f => f.id === 'responsiblePerson');
        expect(field).toBeDefined();
        expect(field!.type).toBe('text');
        expect(field!.required).toBe(true);
      });
    });

    test('a une fonction onSubmit', () => {
      expect(riskAssessmentForm.onSubmit).toBeDefined();
    });
  });

  // ============================================
  // formConfigs export
  // ============================================
  describe('formConfigs export', () => {
    test('exporte tous les formulaires', () => {
      expect(formConfigs).toBeDefined();
      expect(Object.keys(formConfigs).length).toBe(3);
    });

    test('contient resourceRequest', () => {
      expect(formConfigs.resourceRequest).toBe(resourceRequestForm);
    });

    test('contient strategicDecision', () => {
      expect(formConfigs.strategicDecision).toBe(strategicDecisionForm);
    });

    test('contient riskAssessment', () => {
      expect(formConfigs.riskAssessment).toBe(riskAssessmentForm);
    });

    test('tous les formulaires ont des IDs uniques', () => {
      const ids = Object.values(formConfigs).map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('tous les formulaires ont aiEnabled=true', () => {
      Object.values(formConfigs).forEach(form => {
        expect(form.aiEnabled).toBe(true);
      });
    });

    test('tous les formulaires ont une catégorie', () => {
      Object.values(formConfigs).forEach(form => {
        expect(form.category).toBeDefined();
        expect(typeof form.category).toBe('string');
      });
    });
  });

  // ============================================
  // Validation globale des formulaires
  // ============================================
  describe('Validation globale', () => {
    const allForms = [resourceRequestForm, strategicDecisionForm, riskAssessmentForm];

    test('tous les formulaires ont un ID', () => {
      allForms.forEach(form => {
        expect(form.id).toBeDefined();
        expect(typeof form.id).toBe('string');
      });
    });

    test('tous les formulaires ont un titre', () => {
      allForms.forEach(form => {
        expect(form.title).toBeDefined();
        expect(form.title.length).toBeGreaterThan(0);
      });
    });

    test('tous les formulaires ont des champs', () => {
      allForms.forEach(form => {
        expect(form.fields).toBeDefined();
        expect(form.fields.length).toBeGreaterThan(0);
      });
    });

    test('tous les champs ont un ID unique dans leur formulaire', () => {
      allForms.forEach(form => {
        const fieldIds = form.fields.map(f => f.id);
        const uniqueFieldIds = new Set(fieldIds);
        expect(uniqueFieldIds.size).toBe(fieldIds.length);
      });
    });

    test('tous les champs requis ont required=true', () => {
      allForms.forEach(form => {
        form.fields.forEach(field => {
          if (field.required) {
            expect(field.required).toBe(true);
          }
        });
      });
    });

    test('tous les select/radio/multiselect ont des options', () => {
      allForms.forEach(form => {
        form.fields.forEach(field => {
          if (['select', 'radio', 'multiselect'].includes(field.type)) {
            expect(field.options).toBeDefined();
            expect(field.options!.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });
});
