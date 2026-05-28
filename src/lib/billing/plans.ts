export type ProductTier = 'PILOT' | 'SOLO' | 'CABINET' | 'ENTERPRISE';

export const PRODUCT_TIERS: Record<ProductTier, {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  dbName: string;
  trialDays?: number;
}> = {
  PILOT: {
    name: 'Essai',
    priceMonthly: 0,
    priceYearly: 0,
    dbName: 'pilot',
    trialDays: 14,
  },
  SOLO: {
    name: 'Essentiel',
    priceMonthly: 89,
    priceYearly: 855,
    dbName: 'solo',
    trialDays: 14,
  },
  CABINET: {
    name: 'Cabinet',
    priceMonthly: 69,
    priceYearly: 663,
    dbName: 'cabinet',
    trialDays: 14,
  },
  ENTERPRISE: {
    name: 'Premium',
    priceMonthly: 149,
    priceYearly: 1430,
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