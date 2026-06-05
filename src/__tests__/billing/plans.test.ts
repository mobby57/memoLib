/**
 * Tests unitaires — plans.ts
 * Vérifie l'alignement de la grille tarifaire PILOT/SOLO/CABINET/ENTERPRISE
 * @jest-environment node
 */

import { PRODUCT_TIERS, resolvePlanDbName } from '@/lib/billing/plans';
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
    ['SOLO', 89, 855, 'solo'],
    ['CABINET', 69, 663, 'cabinet'],
    ['ENTERPRISE', 149, 1430, 'enterprise'],
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
