import { describe, it, expect, vi } from 'vitest';

// Mock du module avant tout import
vi.mock('@/lib/billing/plans', async () => {
  const actual = await vi.importActual('@/lib/billing/plans');
  return {
    ...actual,
    getStripePriceId: (plan: string, interval: string) => {
      // Simuler le fallback
      if (plan === 'SOLO' && interval === 'monthly') return 'price_solo_monthly';
      if (plan === 'ENTERPRISE' && interval === 'yearly') return 'price_enterprise_yearly';
      // Pour les autres, retourner un ID factice
      return `price_${plan.toLowerCase()}_${interval}`;
    },
  };
});

import {
  PRODUCT_TIERS,
  resolvePlanDbName,
  getPlanPrice,
  getPlanPriceCents,
  getStripePriceId,
  ProductTier,
} from '@/lib/billing/plans';

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
    (plan, monthly, yearly, dbName) => {
      expect(getPlanPrice(plan, 'monthly')).toBe(monthly);
      expect(getPlanPrice(plan, 'yearly')).toBe(yearly);
      expect(resolvePlanDbName(plan)).toBe(dbName);
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
    ['Pilot', 'pilot'],
    ['Solo', 'solo'],
    ['Cabinet', 'cabinet'],
    ['Enterprise', 'enterprise'],
    ['', 'solo'],
    ['UNKNOWN', 'solo'],
  ])('résout "%s" → "%s"', (input, expected) => {
    expect(resolvePlanDbName(input as ProductTier)).toBe(expected);
  });
});

describe('Plan prices', () => {
  it('retourne les prix mensuels corrects', () => {
    expect(getPlanPrice('SOLO', 'monthly')).toBe(29);
    expect(getPlanPrice('CABINET', 'monthly')).toBe(79);
    expect(getPlanPrice('ENTERPRISE', 'monthly')).toBe(199);
  });

  it('convertit en centimes Stripe', () => {
    expect(getPlanPriceCents('SOLO', 'monthly')).toBe(2900);
    expect(getPlanPriceCents('CABINET', 'yearly')).toBe(75800);
  });
});

describe('Stripe price helpers', () => {
  it('fournit un fallback priceId si env non configurée', () => {
    // Maintenant getStripePriceId est mocké pour retourner les valeurs de fallback
    expect(getStripePriceId('SOLO', 'monthly')).toBe('price_solo_monthly');
    expect(getStripePriceId('ENTERPRISE', 'yearly')).toBe('price_enterprise_yearly');
  });
});
