import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Tests unitaires — plans.ts
 * Vérifie l'alignement de la grille tarifaire PILOT/SOLO/CABINET/ENTERPRISE
 * @jest-environment node
 */

import { PRODUCT_TIERS, resolvePlanDbName, getStripePriceId, getPlanPrice, getPlanPriceCents } from '@/lib/billing/plans';
import type { ProductTier } from '@/lib/billing/plans';

describe('PRODUCT_TIERS', () => {
  it('contient exactement 4 plans', () => {
    expect(Object.keys(PRODUCT_TIERS)).toHaveLength(4);
  });

  it('a les bons noms de plans', () => {
    expect(Object.keys(PRODUCT_TIERS)).toEqual(['PILOT', 'SOLO', 'CABINET', 'ENTERPRISE']);
  });

  it.each([
    ['PILOT', 0, 0, 'pilot'],
    ['SOLO', 29, 278, 'solo'],
    ['CABINET', 79, 758, 'cabinet'],
    ['ENTERPRISE', 199, 1910, 'enterprise'],
  ] as [ProductTier, number, number, string][])(
    '%s → %d€/mois, %d€/an, dbName=%s',
    (tier, monthly, yearly, dbName) => {
      const plan = PRODUCT_TIERS[tier];
      expect(plan.priceMonthly).toBe(monthly);
      expect(plan.priceYearly).toBe(yearly);
      expect(plan.dbName).toBe(dbName);
    }
  );

  it('PILOT a 14 jours de trial', () => {
    expect(PRODUCT_TIERS.PILOT.trialDays).toBe(14);
  });

  it('les plans payants ont 14 jours de trial', () => {
    expect(PRODUCT_TIERS.SOLO.trialDays).toBe(14);
    expect(PRODUCT_TIERS.CABINET.trialDays).toBe(14);
    expect(PRODUCT_TIERS.ENTERPRISE.trialDays).toBe(14);
  });
});

describe('resolvePlanDbName', () => {
  it.each([
    ['PILOT', 'pilot'],
    ['SOLO', 'solo'],
    ['CABINET', 'cabinet'],
    ['ENTERPRISE', 'enterprise'],
    ['pilot', 'pilot'],
    ['solo', 'solo'],
    ['cabinet', 'cabinet'],
    ['enterprise', 'enterprise'],
  ])('résout "%s" → "%s"', (input, expected) => {
    expect(resolvePlanDbName(input)).toBe(expected);
  });

  it('résout les aliases legacy', () => {
    expect(resolvePlanDbName('STARTER')).toBe('pilot');
    expect(resolvePlanDbName('FREE')).toBe('pilot');
    expect(resolvePlanDbName('PRO')).toBe('cabinet');
  });

  it('retourne "solo" par défaut si input vide ou inconnu', () => {
    expect(resolvePlanDbName()).toBe('solo');
    expect(resolvePlanDbName('')).toBe('solo');
    expect(resolvePlanDbName('UNKNOWN_PLAN')).toBe('solo');
  });
});

describe('Stripe price helpers', () => {
  it('retourne les prix mensuels corrects', () => {
    expect(getPlanPrice('SOLO')).toBe(29);
    expect(getPlanPrice('CABINET')).toBe(79);
    expect(getPlanPrice('ENTERPRISE')).toBe(199);
  });

  it('convertit en centimes Stripe', () => {
    expect(getPlanPriceCents('SOLO')).toBe(2900);
    expect(getPlanPriceCents('CABINET')).toBe(7900);
    expect(getPlanPriceCents('ENTERPRISE')).toBe(19900);
  });

  it('fournit un fallback priceId si env non configurée', async () => {
    const saved = {
      STRIPE_PRICE_SOLO_MONTHLY: process.env.STRIPE_PRICE_SOLO_MONTHLY,
      STRIPE_PRICE_ENTERPRISE_YEARLY: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    };

    try {
      delete process.env.STRIPE_PRICE_SOLO_MONTHLY;
      delete process.env.STRIPE_PRICE_ENTERPRISE_YEARLY;

      vi.resetModules();

      const {
        getStripePriceId: getFreshStripePriceId,
      } = await import('@/lib/billing/plans');

      expect(getFreshStripePriceId('SOLO', 'monthly')).toBe('price_solo_monthly');
      expect(getFreshStripePriceId('ENTERPRISE', 'yearly')).toBe('price_enterprise_yearly');
    } finally {
      if (saved.STRIPE_PRICE_SOLO_MONTHLY !== undefined) {
        process.env.STRIPE_PRICE_SOLO_MONTHLY = saved.STRIPE_PRICE_SOLO_MONTHLY;
      } else {
        delete process.env.STRIPE_PRICE_SOLO_MONTHLY;
      }

      if (saved.STRIPE_PRICE_ENTERPRISE_YEARLY !== undefined) {
        process.env.STRIPE_PRICE_ENTERPRISE_YEARLY = saved.STRIPE_PRICE_ENTERPRISE_YEARLY;
      } else {
        delete process.env.STRIPE_PRICE_ENTERPRISE_YEARLY;
      }

      vi.resetModules();
    }
  });
});
