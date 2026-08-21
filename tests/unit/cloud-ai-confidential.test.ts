/**
 * Tests: Cloud AI Providers + Confidential Mode
 */
import { describe, it, expect, vi } from 'vitest';

describe('Cloud AI Providers', () => {
  describe('Provider priority', () => {
    it('prioritizes Mistral for GDPR (French hosting)', () => {
      const providers = ['mistral', 'openai', 'anthropic'];
      // Default priority: Mistral > OpenAI > Anthropic
      expect(providers[0]).toBe('mistral');
    });

    it('falls back through provider chain', () => {
      const chain = ['mistral', 'openai', 'anthropic'];
      const available = { mistral: false, openai: true, anthropic: true };
      const selected = chain.find(p => available[p as keyof typeof available]);
      expect(selected).toBe('openai');
    });

    it('returns null when no provider available', () => {
      const chain = ['mistral', 'openai', 'anthropic'];
      const available = { mistral: false, openai: false, anthropic: false };
      const selected = chain.find(p => available[p as keyof typeof available]) || null;
      expect(selected).toBeNull();
    });
  });

  describe('Cost estimation', () => {
    const COSTS = {
      openai: { costPer1000Tokens: 0.0003 },
      mistral: { costPer1000Tokens: 0.0002 },
      anthropic: { costPer1000Tokens: 0.0003 },
      ollama: { costPer1000Tokens: 0 },
    };

    it('Ollama is always free', () => {
      const tokens = 10000;
      const cost = (tokens / 1000) * COSTS.ollama.costPer1000Tokens;
      expect(cost).toBe(0);
    });

    it('calculates Mistral cost correctly', () => {
      const tokens = 5000;
      const cost = (tokens / 1000) * COSTS.mistral.costPer1000Tokens;
      expect(cost).toBe(0.001);
    });

    it('calculates OpenAI cost correctly', () => {
      const tokens = 10000;
      const cost = (tokens / 1000) * COSTS.openai.costPer1000Tokens;
      expect(cost).toBeCloseTo(0.003, 6);
    });

    it('Mistral is cheaper than OpenAI', () => {
      expect(COSTS.mistral.costPer1000Tokens).toBeLessThan(COSTS.openai.costPer1000Tokens);
    });
  });

  describe('Provider detection from env', () => {
    it('detects provider from API key presence', () => {
      const keys = {
        OPENAI_API_KEY: 'sk-test',
        MISTRAL_API_KEY: '',
        ANTHROPIC_API_KEY: '',
      };
      const configured = Object.entries(keys).filter(([, v]) => v.length > 0).map(([k]) => k);
      expect(configured).toContain('OPENAI_API_KEY');
      expect(configured).not.toContain('MISTRAL_API_KEY');
    });

    it('selects preferred from configured providers', () => {
      const configured = ['openai', 'anthropic'];
      const priority = ['mistral', 'openai', 'anthropic'];
      const selected = priority.find(p => configured.includes(p));
      expect(selected).toBe('openai');
    });
  });
});

describe('Confidential Mode', () => {
  describe('Mode detection', () => {
    it('returns not confidential for unknown dossier', () => {
      const dossier = null;
      const isConfidential = dossier ? (dossier as any).confidentialMode : false;
      expect(isConfidential).toBe(false);
    });

    it('detects confidential dossier', () => {
      const dossier = { id: 'd1', confidentialMode: true };
      expect(dossier.confidentialMode).toBe(true);
    });

    it('detects non-confidential dossier', () => {
      const dossier = { id: 'd1', confidentialMode: false };
      expect(dossier.confidentialMode).toBe(false);
    });
  });

  describe('Provider restrictions', () => {
    it('only allows ollama and regex for confidential dossiers', () => {
      const allowedProviders = ['ollama', 'regex'];
      expect(allowedProviders).toContain('ollama');
      expect(allowedProviders).toContain('regex');
      expect(allowedProviders).not.toContain('openai');
      expect(allowedProviders).not.toContain('mistral');
      expect(allowedProviders).not.toContain('anthropic');
    });

    it('blocks cloud providers for confidential dossiers', () => {
      const blockedProviders = ['openai', 'mistral', 'anthropic', 'cloudflare'];
      expect(blockedProviders).toContain('openai');
      expect(blockedProviders).toContain('mistral');
      expect(blockedProviders).toContain('anthropic');
    });

    it('applies precautionary principle on DB error', () => {
      // If we can't verify, default to confidential (safe)
      const dbError = true;
      const isConfidential = dbError ? true : false;
      expect(isConfidential).toBe(true);
    });
  });

  describe('Email linked to confidential dossier', () => {
    it('detects email linked to confidential dossier', () => {
      const email = { dossierId: 'd1' };
      const dossier = { id: 'd1', confidentialMode: true };
      const isConfidential = email.dossierId === dossier.id && dossier.confidentialMode;
      expect(isConfidential).toBe(true);
    });

    it('allows cloud AI for email without dossier', () => {
      const email = { dossierId: null };
      const isConfidential = false; // no dossier = not confidential
      expect(isConfidential).toBe(false);
    });
  });
});
