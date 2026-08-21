/**
 * Tests pour src/lib/forms/formConfigs.ts
 */
import { describe, it, expect } from 'vitest';
import { formConfigs, resourceRequestForm, strategicDecisionForm, riskAssessmentForm } from '@/lib/forms/formConfigs';

describe('formConfigs.ts — Full Coverage', () => {
  describe('resourceRequestForm', () => {
    it('should have correct id and metadata', () => {
      expect(resourceRequestForm.id).toBe('resource-request');
      expect(resourceRequestForm.title).toBe('Demande de Ressources');
      expect(resourceRequestForm.category).toBe('resource');
      expect(resourceRequestForm.aiEnabled).toBe(true);
      expect(resourceRequestForm.requiresApproval).toBe(true);
      expect(resourceRequestForm.approvers).toContain('Directeur');
    });

    it('should have required fields with correct types', () => {
      const fields = resourceRequestForm.fields;
      expect(fields.length).toBeGreaterThan(0);
      
      const resourceType = fields.find(f => f.id === 'resourceType');
      expect(resourceType?.type).toBe('select');
      expect(resourceType?.required).toBe(true);
      expect(resourceType?.options?.length).toBe(4);

      const justification = fields.find(f => f.id === 'justification');
      expect(justification?.type).toBe('textarea');
      expect(justification?.required).toBe(true);

      const urgency = fields.find(f => f.id === 'urgency');
      expect(urgency?.type).toBe('radio');
      expect(urgency?.required).toBe(true);

      const cost = fields.find(f => f.id === 'estimatedCost');
      expect(cost?.type).toBe('number');
      expect(cost?.dependsOn).toBe('resourceType');
    });

    it('should have impact analysis on key fields', () => {
      const fields = resourceRequestForm.fields;
      const resourceType = fields.find(f => f.id === 'resourceType');
      expect(resourceType?.impactAnalysis?.level).toBe('high');
      expect(resourceType?.impactAnalysis?.affectedAreas).toContain('Budget');
    });

    it('should have an onSubmit function', () => {
      expect(typeof resourceRequestForm.onSubmit).toBe('function');
    });
  });

  describe('strategicDecisionForm', () => {
    it('should have correct id and metadata', () => {
      expect(strategicDecisionForm.id).toBe('strategic-decision');
      expect(strategicDecisionForm.category).toBe('strategy');
      expect(strategicDecisionForm.impactThreshold).toBe('high');
    });

    it('should have all required fields', () => {
      const fields = strategicDecisionForm.fields;
      const ids = fields.map(f => f.id);
      expect(ids).toContain('decisionTitle');
      expect(ids).toContain('context');
      expect(ids).toContain('proposedSolution');
      expect(ids).toContain('expectedImpact');
      expect(ids).toContain('risks');
      expect(ids).toContain('timeline');
      expect(ids).toContain('kpis');
    });

    it('should have critical impact on proposedSolution and risks', () => {
      const fields = strategicDecisionForm.fields;
      const solution = fields.find(f => f.id === 'proposedSolution');
      expect(solution?.impactAnalysis?.level).toBe('critical');
      const risks = fields.find(f => f.id === 'risks');
      expect(risks?.impactAnalysis?.level).toBe('critical');
    });
  });

  describe('riskAssessmentForm', () => {
    it('should have correct id and metadata', () => {
      expect(riskAssessmentForm.id).toBe('risk-assessment');
      expect(riskAssessmentForm.category).toBe('risk');
      expect(riskAssessmentForm.requiresApproval).toBe(false);
    });

    it('should have all fields', () => {
      const ids = riskAssessmentForm.fields.map(f => f.id);
      expect(ids).toContain('riskCategory');
      expect(ids).toContain('riskDescription');
      expect(ids).toContain('probability');
      expect(ids).toContain('severity');
      expect(ids).toContain('mitigationPlan');
      expect(ids).toContain('responsiblePerson');
    });

    it('should have risk category options', () => {
      const cat = riskAssessmentForm.fields.find(f => f.id === 'riskCategory');
      expect(cat?.options?.length).toBe(6);
    });
  });

  describe('formConfigs export', () => {
    it('should export all 3 configs', () => {
      expect(formConfigs.resourceRequest).toBe(resourceRequestForm);
      expect(formConfigs.strategicDecision).toBe(strategicDecisionForm);
      expect(formConfigs.riskAssessment).toBe(riskAssessmentForm);
    });
  });
});
