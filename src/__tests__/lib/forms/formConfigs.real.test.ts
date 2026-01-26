/**
 * Tests réels pour les configurations de formulaires
 * Ces tests IMPORTENT le vrai fichier pour augmenter le coverage
 */

import {
  resourceRequestForm,
  strategicDecisionForm,
  riskAssessmentForm,
  formConfigs,
} from '@/lib/forms/formConfigs';

describe('formConfigs - Configurations de formulaires', () => {
  describe('resourceRequestForm', () => {
    it('devrait avoir un id valide', () => {
      expect(resourceRequestForm.id).toBe('resource-request');
    });

    it('devrait avoir un titre', () => {
      expect(resourceRequestForm.title).toBe('Demande de Ressources');
    });

    it('devrait avoir aiEnabled activé', () => {
      expect(resourceRequestForm.aiEnabled).toBe(true);
    });

    it('devrait nécessiter une approbation', () => {
      expect(resourceRequestForm.requiresApproval).toBe(true);
    });

    it('devrait avoir des approbateurs définis', () => {
      expect(resourceRequestForm.approvers).toContain('Directeur');
      expect(resourceRequestForm.approvers).toContain('RH Manager');
    });

    it('devrait avoir des champs définis', () => {
      expect(Array.isArray(resourceRequestForm.fields)).toBe(true);
      expect(resourceRequestForm.fields.length).toBeGreaterThan(0);
    });

    it('devrait avoir un champ resourceType', () => {
      const field = resourceRequestForm.fields.find(f => f.id === 'resourceType');
      expect(field).toBeDefined();
      expect(field?.type).toBe('select');
      expect(field?.required).toBe(true);
    });

    it('devrait avoir un champ justification', () => {
      const field = resourceRequestForm.fields.find(f => f.id === 'justification');
      expect(field).toBeDefined();
      expect(field?.type).toBe('textarea');
    });

    it('devrait avoir un champ urgency', () => {
      const field = resourceRequestForm.fields.find(f => f.id === 'urgency');
      expect(field).toBeDefined();
      expect(field?.type).toBe('radio');
    });

    it('devrait avoir une fonction onSubmit', () => {
      expect(typeof resourceRequestForm.onSubmit).toBe('function');
    });
  });

  describe('strategicDecisionForm', () => {
    it('devrait avoir un id valide', () => {
      expect(strategicDecisionForm.id).toBe('strategic-decision');
    });

    it('devrait avoir un titre', () => {
      expect(strategicDecisionForm.title).toBe('Decision Strategique');
    });

    it('devrait être de catégorie strategy', () => {
      expect(strategicDecisionForm.category).toBe('strategy');
    });

    it('devrait avoir un seuil d\'impact élevé', () => {
      expect(strategicDecisionForm.impactThreshold).toBe('high');
    });

    it('devrait avoir des champs requis', () => {
      const requiredFields = strategicDecisionForm.fields.filter(f => f.required);
      expect(requiredFields.length).toBeGreaterThan(0);
    });

    it('devrait avoir un champ proposedSolution avec impactAnalysis', () => {
      const field = strategicDecisionForm.fields.find(f => f.id === 'proposedSolution');
      expect(field).toBeDefined();
      expect(field?.impactAnalysis).toBeDefined();
      expect(field?.impactAnalysis?.level).toBe('critical');
    });

    it('devrait avoir un champ expectedImpact de type multiselect', () => {
      const field = strategicDecisionForm.fields.find(f => f.id === 'expectedImpact');
      expect(field).toBeDefined();
      expect(field?.type).toBe('multiselect');
    });
  });

  describe('riskAssessmentForm', () => {
    it('devrait avoir un id valide', () => {
      expect(riskAssessmentForm.id).toBe('risk-assessment');
    });

    it('devrait avoir un titre', () => {
      expect(riskAssessmentForm.title).toBe('evaluation des Risques');
    });

    it('devrait être de catégorie risk', () => {
      expect(riskAssessmentForm.category).toBe('risk');
    });

    it('ne devrait pas nécessiter d\'approbation', () => {
      expect(riskAssessmentForm.requiresApproval).toBe(false);
    });

    it('devrait avoir un champ riskCategory', () => {
      const field = riskAssessmentForm.fields.find(f => f.id === 'riskCategory');
      expect(field).toBeDefined();
      expect(field?.type).toBe('select');
      expect(field?.options?.length).toBeGreaterThan(0);
    });

    it('devrait avoir un champ probability', () => {
      const field = riskAssessmentForm.fields.find(f => f.id === 'probability');
      expect(field).toBeDefined();
      expect(field?.type).toBe('radio');
    });

    it('devrait avoir un champ severity', () => {
      const field = riskAssessmentForm.fields.find(f => f.id === 'severity');
      expect(field).toBeDefined();
      expect(field?.impactAnalysis?.level).toBe('critical');
    });
  });

  describe('formConfigs export', () => {
    it('devrait exporter tous les formulaires', () => {
      expect(formConfigs.resourceRequest).toBe(resourceRequestForm);
      expect(formConfigs.strategicDecision).toBe(strategicDecisionForm);
      expect(formConfigs.riskAssessment).toBe(riskAssessmentForm);
    });

    it('devrait avoir 3 formulaires', () => {
      expect(Object.keys(formConfigs)).toHaveLength(3);
    });
  });

  describe('Validation des champs', () => {
    it('tous les champs devraient avoir un id unique', () => {
      const allForms = [resourceRequestForm, strategicDecisionForm, riskAssessmentForm];
      
      allForms.forEach(form => {
        const ids = form.fields.map(f => f.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids.length).toBe(uniqueIds.length);
      });
    });

    it('tous les champs devraient avoir un type valide', () => {
      const validTypes = ['text', 'textarea', 'select', 'multiselect', 'radio', 'number', 'checkbox'];
      const allForms = [resourceRequestForm, strategicDecisionForm, riskAssessmentForm];
      
      allForms.forEach(form => {
        form.fields.forEach(field => {
          expect(validTypes).toContain(field.type);
        });
      });
    });

    it('tous les champs devraient avoir un label', () => {
      const allForms = [resourceRequestForm, strategicDecisionForm, riskAssessmentForm];
      
      allForms.forEach(form => {
        form.fields.forEach(field => {
          expect(field.label).toBeDefined();
          expect(typeof field.label).toBe('string');
          expect(field.label.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Impact Analysis', () => {
    it('les champs critiques devraient avoir une impactAnalysis', () => {
      // Vérifie que les champs importants ont une analyse d'impact
      const severityField = riskAssessmentForm.fields.find(f => f.id === 'severity');
      expect(severityField?.impactAnalysis).toBeDefined();
      expect(severityField?.impactAnalysis?.affectedAreas).toBeDefined();
    });

    it('impactAnalysis devrait avoir les propriétés requises', () => {
      const allForms = [resourceRequestForm, strategicDecisionForm, riskAssessmentForm];
      
      allForms.forEach(form => {
        form.fields.forEach(field => {
          if (field.impactAnalysis) {
            expect(field.impactAnalysis.level).toBeDefined();
            expect(field.impactAnalysis.description).toBeDefined();
            expect(['low', 'medium', 'high', 'critical']).toContain(field.impactAnalysis.level);
          }
        });
      });
    });
  });
});
