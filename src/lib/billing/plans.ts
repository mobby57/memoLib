export type ProductTier = 'PILOT' | 'SOLO' | 'CABINET' | 'ENTERPRISE';

export const PRODUCT_TIERS: Record<ProductTier, {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  dbName: string;
  trialDays?: number;
}> = {
  PILOT: {
    name: 'Pilot',
    priceMonthly: 0,
    priceYearly: 0,
    dbName: 'pilot',
    trialDays: 30,
  },
  SOLO: {
    name: 'Solo',
    priceMonthly: 49,
    priceYearly: 468,
    dbName: 'solo',
    trialDays: 14,
  },
  CABINET: {
    name: 'Cabinet',
    priceMonthly: 349,
    priceYearly: 3348,
    dbName: 'cabinet',
    trialDays: 14,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceMonthly: 599,
    priceYearly: 5748,
    dbName: 'enterprise',
    trialDays: 14,
  },
};

export function resolvePlanDbName(plan?: string): string {
  if (!plan) return 'solo';
  const key = String(plan).trim().toUpperCase();
  switch (key) {
    case 'PILOT':
    case 'PILOT_PLAN':
    case 'STARTER':
    case 'FREE':
      return PRODUCT_TIERS.PILOT.dbName;
    case 'SOLO':
    case 'SOLO_PLAN':
      return PRODUCT_TIERS.SOLO.dbName;
    case 'CABINET':
    case 'AGENCY':
      return PRODUCT_TIERS.CABINET.dbName;
    case 'ENTERPRISE':
    case 'CORPORATE':
      return PRODUCT_TIERS.ENTERPRISE.dbName;
    case 'PRO':
      // legacy mapping: PRO used to map to CABINET in older plans
      return PRODUCT_TIERS.CABINET.dbName;
    default:
      // fallback try to match by known dbName values
      for (const v of Object.values(PRODUCT_TIERS)) {
        if (v.dbName === plan.toLowerCase()) return v.dbName;
      }
      return PRODUCT_TIERS.SOLO.dbName;
  }
}