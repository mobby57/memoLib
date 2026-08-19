/**
 * Tests pour src/lib/reasoning/prompts.ts - fonctions utilitaires
 */
import { describe, it, expect } from 'vitest';
import {
  SYSTEM_BASE_PROMPT,
  EXTRACT_FACTS_PROMPT,
  buildPromptContext,
  getPromptForTransition,
  fillPromptTemplate,
} from '@/lib/reasoning/prompts';

describe('prompts.ts — Full Coverage', () => {
  describe('SYSTEM_BASE_PROMPT', () => {
    it('should contain CESEDA reference', () => {
      expect(SYSTEM_BASE_PROMPT).toContain('CESEDA');
    });

    it('should contain the 7 rules', () => {
      expect(SYSTEM_BASE_PROMPT).toContain('JSON valide');
      expect(SYSTEM_BASE_PROMPT).toContain('confiance');
      expect(SYSTEM_BASE_PROMPT).toContain('JAMAIS');
    });
  });

  describe('EXTRACT_FACTS_PROMPT', () => {
    it('should include system base prompt', () => {
      expect(EXTRACT_FACTS_PROMPT).toContain(SYSTEM_BASE_PROMPT);
    });

    it('should define fact structure', () => {
      expect(EXTRACT_FACTS_PROMPT).toContain('FAIT CERTAIN');
      expect(EXTRACT_FACTS_PROMPT).toContain('EXPLICIT_MESSAGE');
      expect(EXTRACT_FACTS_PROMPT).toContain('confidence');
    });
  });

  describe('buildPromptContext', () => {
    it('should build context from full workspace', () => {
      const workspace = {
        sourceRaw: 'Email brut',
        facts: [{ label: 'Date', value: '2026-01-01' }],
        contexts: [{ key: 'immigration' }],
        obligations: [{ type: 'recours', deadline: '2026-02-01' }],
        missingElements: [
          { label: 'Passeport', blocking: true, resolved: false },
          { label: 'Adresse', blocking: false, resolved: true },
        ],
        risks: [{ type: 'expulsion' }],
        proposedActions: [{ action: 'recours TA' }, { action: 'refere' }],
      };

      const ctx = buildPromptContext(workspace);
      expect(ctx.sourceRaw).toBe('Email brut');
      expect(ctx.factsCount).toBe('1');
      expect(ctx.contextsCount).toBe('1');
      expect(ctx.obligationsCount).toBe('1');
      expect(ctx.blockingUnresolvedCount).toBe('1');
      expect(ctx.risksCount).toBe('1');
      expect(ctx.actionsCount).toBe('2');
      expect(JSON.parse(ctx.facts)).toHaveLength(1);
    });

    it('should handle empty workspace', () => {
      const ctx = buildPromptContext({});
      expect(ctx.sourceRaw).toBe('');
      expect(ctx.factsCount).toBe('0');
      expect(ctx.contextsCount).toBe('0');
      expect(ctx.obligationsCount).toBe('0');
      expect(ctx.blockingUnresolvedCount).toBe('0');
      expect(ctx.risksCount).toBe('0');
      expect(ctx.actionsCount).toBe('0');
    });

    it('should handle workspace with null arrays', () => {
      const ctx = buildPromptContext({
        facts: null,
        contexts: undefined,
        missingElements: null,
      });
      expect(ctx.factsCount).toBe('0');
      expect(ctx.contextsCount).toBe('0');
      expect(ctx.blockingUnresolvedCount).toBe('0');
    });
  });

  describe('getPromptForTransition', () => {
    it('should return prompt for RECEIVED -> FACTS_EXTRACTED', () => {
      const prompt = getPromptForTransition('RECEIVED', 'FACTS_EXTRACTED');
      expect(prompt).toBe(EXTRACT_FACTS_PROMPT);
    });

    it('should return prompt for FACTS_EXTRACTED -> CONTEXT_IDENTIFIED', () => {
      const prompt = getPromptForTransition('FACTS_EXTRACTED', 'CONTEXT_IDENTIFIED');
      expect(prompt).not.toBeNull();
      expect(prompt).toContain('CESEDA');
    });

    it('should return prompt for CONTEXT_IDENTIFIED -> OBLIGATIONS_DEDUCED', () => {
      const prompt = getPromptForTransition('CONTEXT_IDENTIFIED', 'OBLIGATIONS_DEDUCED');
      expect(prompt).not.toBeNull();
    });

    it('should return prompt for OBLIGATIONS_DEDUCED -> MISSING_IDENTIFIED', () => {
      const prompt = getPromptForTransition('OBLIGATIONS_DEDUCED', 'MISSING_IDENTIFIED');
      expect(prompt).not.toBeNull();
    });

    it('should return prompt for MISSING_IDENTIFIED -> RISK_EVALUATED', () => {
      const prompt = getPromptForTransition('MISSING_IDENTIFIED', 'RISK_EVALUATED');
      expect(prompt).not.toBeNull();
    });

    it('should return prompt for RISK_EVALUATED -> ACTION_PROPOSED', () => {
      const prompt = getPromptForTransition('RISK_EVALUATED', 'ACTION_PROPOSED');
      expect(prompt).not.toBeNull();
    });

    it('should return prompt for ACTION_PROPOSED -> READY_FOR_HUMAN', () => {
      const prompt = getPromptForTransition('ACTION_PROPOSED', 'READY_FOR_HUMAN');
      expect(prompt).not.toBeNull();
    });

    it('should return null for unknown transitions', () => {
      expect(getPromptForTransition('UNKNOWN', 'STATE')).toBeNull();
      expect(getPromptForTransition('RECEIVED', 'UNKNOWN')).toBeNull();
    });
  });

  describe('fillPromptTemplate', () => {
    it('should replace single variable', () => {
      const result = fillPromptTemplate('Hello {name}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('should replace multiple variables', () => {
      const result = fillPromptTemplate(
        'Facts: {factsCount}, Risks: {risksCount}',
        { factsCount: '3', risksCount: '2' }
      );
      expect(result).toBe('Facts: 3, Risks: 2');
    });

    it('should leave unreplaced variables as-is', () => {
      const result = fillPromptTemplate('Hello {name} and {unknown}', { name: 'World' });
      expect(result).toBe('Hello World and {unknown}');
    });

    it('should handle empty context', () => {
      const result = fillPromptTemplate('No vars here', {});
      expect(result).toBe('No vars here');
    });

    it('should handle template with JSON content', () => {
      const result = fillPromptTemplate(
        'Source: {sourceRaw}\nFacts: {facts}',
        { sourceRaw: 'email text', facts: '[{"label":"test"}]' }
      );
      expect(result).toContain('email text');
      expect(result).toContain('[{"label":"test"}]');
    });
  });
});
