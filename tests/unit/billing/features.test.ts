/**
 * Tests — Feature Gate System
 */

import { describe, it, expect } from 'vitest';
import { FeatureGate, FeatureGateError, FEATURE_TIERS, TIER_ORDER } from '@/lib/billing/features';
import type { Feature, ProductTier } from '@/lib/billing/features';

describe('FeatureGate', () => {
  describe('can()', () => {
    it('PILOT can access PILOT features', () => {
      const gate = new FeatureGate('PILOT');
      expect(gate.can('dossiers_create')).toBe(true);
      expect(gate.can('dossiers_checklist')).toBe(true);
      expect(gate.can('deadlines_alerts')).toBe(true);
      expect(gate.can('documents_upload')).toBe(true);
      expect(gate.can('reporting_dashboard')).toBe(true);
    });

    it('PILOT cannot access SOLO features', () => {
      const gate = new FeatureGate('PILOT');
      expect(gate.can('ai_email_summary')).toBe(false);
      expect(gate.can('emails_inbound')).toBe(false);
      expect(gate.can('workflows_basic')).toBe(false);
    });

    it('SOLO can access PILOT + SOLO features', () => {
      const gate = new FeatureGate('SOLO');
      // PILOT features
      expect(gate.can('dossiers_create')).toBe(true);
      expect(gate.can('deadlines_alerts')).toBe(true);
      // SOLO features
      expect(gate.can('ai_email_summary')).toBe(true);
      expect(gate.can('ai_classification')).toBe(true);
      expect(gate.can('emails_inbound')).toBe(true);
      expect(gate.can('workflows_basic')).toBe(true);
      expect(gate.can('dossiers_timeline')).toBe(true);
    });

    it('SOLO cannot access CABINET features', () => {
      const gate = new FeatureGate('SOLO');
      expect(gate.can('ai_draft_reply')).toBe(false);
      expect(gate.can('ai_copilot_ceseda')).toBe(false);
      expect(gate.can('documents_generation')).toBe(false);
      expect(gate.can('jurisprudence_search')).toBe(false);
      expect(gate.can('client_portal')).toBe(false);
    });

    it('CABINET can access PILOT + SOLO + CABINET features', () => {
      const gate = new FeatureGate('CABINET');
      // PILOT
      expect(gate.can('dossiers_create')).toBe(true);
      // SOLO
      expect(gate.can('ai_email_summary')).toBe(true);
      // CABINET
      expect(gate.can('ai_draft_reply')).toBe(true);
      expect(gate.can('ai_copilot_ceseda')).toBe(true);
      expect(gate.can('documents_generation')).toBe(true);
      expect(gate.can('jurisprudence_search')).toBe(true);
      expect(gate.can('client_portal')).toBe(true);
      expect(gate.can('emails_auto_reminders')).toBe(true);
    });

    it('CABINET cannot access ENTERPRISE features', () => {
      const gate = new FeatureGate('CABINET');
      expect(gate.can('documents_ocr')).toBe(false);
      expect(gate.can('ai_advanced_analytics')).toBe(false);
      expect(gate.can('workflows_advanced')).toBe(false);
      expect(gate.can('integrations_api')).toBe(false);
      expect(gate.can('multi_tenant_sub_offices')).toBe(false);
    });

    it('ENTERPRISE can access all features', () => {
      const gate = new FeatureGate('ENTERPRISE');
      const allFeatures = Object.keys(FEATURE_TIERS) as Feature[];
      for (const f of allFeatures) {
        expect(gate.can(f)).toBe(true);
      }
    });
  });

  describe('check()', () => {
    it('returns allowed=true for accessible features', () => {
      const gate = new FeatureGate('CABINET');
      const result = gate.check('ai_draft_reply');
      expect(result.allowed).toBe(true);
      expect(result.upgradeRequired).toBe(false);
      expect(result.currentTier).toBe('CABINET');
      expect(result.requiredTier).toBe('CABINET');
    });

    it('returns allowed=false with upgrade info for gated features', () => {
      const gate = new FeatureGate('SOLO');
      const result = gate.check('ai_draft_reply');
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
      expect(result.currentTier).toBe('SOLO');
      expect(result.requiredTier).toBe('CABINET');
      expect(result.message).toContain('Cabinet');
    });
  });

  describe('checkAll()', () => {
    it('returns a map of feature availability', () => {
      const gate = new FeatureGate('SOLO');
      const results = gate.checkAll([
        'dossiers_create',
        'ai_email_summary',
        'ai_draft_reply',
        'documents_ocr',
      ]);
      expect(results.dossiers_create).toBe(true);
      expect(results.ai_email_summary).toBe(true);
      expect(results.ai_draft_reply).toBe(false);
      expect(results.documents_ocr).toBe(false);
    });
  });

  describe('availableFeatures()', () => {
    it('PILOT has fewer features than SOLO', () => {
      const pilot = new FeatureGate('PILOT');
      const solo = new FeatureGate('SOLO');
      expect(pilot.availableFeatures().length).toBeLessThan(solo.availableFeatures().length);
    });

    it('ENTERPRISE has all features', () => {
      const enterprise = new FeatureGate('ENTERPRISE');
      const allFeatures = Object.keys(FEATURE_TIERS) as Feature[];
      expect(enterprise.availableFeatures().length).toBe(allFeatures.length);
    });
  });

  describe('nextTierFeatures()', () => {
    it('SOLO gets CABINET features as next tier', () => {
      const gate = new FeatureGate('SOLO');
      const next = gate.nextTierFeatures();
      expect(next).not.toBeNull();
      expect(next!.tier).toBe('CABINET');
      expect(next!.features).toContain('ai_draft_reply');
      expect(next!.features).toContain('ai_copilot_ceseda');
    });

    it('ENTERPRISE has no next tier', () => {
      const gate = new FeatureGate('ENTERPRISE');
      const next = gate.nextTierFeatures();
      expect(next).toBeNull();
    });
  });
});

describe('FeatureGateError', () => {
  it('has correct statusCode', () => {
    const result = {
      allowed: false,
      feature: 'ai_draft_reply' as Feature,
      currentTier: 'SOLO' as ProductTier,
      requiredTier: 'CABINET' as ProductTier,
      upgradeRequired: true,
      message: 'Upgrade required',
    };
    const error = new FeatureGateError(result);
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe('FeatureGateError');
  });

  it('toJSON includes upgrade URL', () => {
    const result = {
      allowed: false,
      feature: 'ai_draft_reply' as Feature,
      currentTier: 'SOLO' as ProductTier,
      requiredTier: 'CABINET' as ProductTier,
      upgradeRequired: true,
      message: 'Upgrade required',
    };
    const error = new FeatureGateError(result);
    const json = error.toJSON();
    expect(json.error).toBe('FEATURE_GATED');
    expect(json.upgradeUrl).toBe('/settings/billing?upgrade=true');
    expect(json.requiredTier).toBe('CABINET');
  });
});

describe('Tier hierarchy consistency', () => {
  it('TIER_ORDER has 4 levels', () => {
    expect(Object.keys(TIER_ORDER)).toHaveLength(4);
  });

  it('every feature maps to a valid tier', () => {
    const validTiers = Object.keys(TIER_ORDER);
    for (const [feature, tier] of Object.entries(FEATURE_TIERS)) {
      expect(validTiers).toContain(tier);
    }
  });

  it('hierarchy is strictly ordered', () => {
    expect(TIER_ORDER.PILOT).toBeLessThan(TIER_ORDER.SOLO);
    expect(TIER_ORDER.SOLO).toBeLessThan(TIER_ORDER.CABINET);
    expect(TIER_ORDER.CABINET).toBeLessThan(TIER_ORDER.ENTERPRISE);
  });
});
