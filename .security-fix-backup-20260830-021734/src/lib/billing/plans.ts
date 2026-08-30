export type ProductTier = 'PILOT' | 'SOLO' | 'CABINET' | 'ENTERPRISE';
export type BillingCycle = 'monthly' | 'yearly';

export const PRODUCT_TIERS: Record<ProductTier, {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  dbName: string;
  trialDays?: number;
  maxUsers: number;
  maxDossiers: number;
  maxStorageGb: number;
  aiBudgetEur: number;
}> = {
  PILOT: {
    name: 'Essai',
    priceMonthly: 0,
    priceYearly: 0,
    dbName: 'pilot',
    trialDays: 14,
    maxUsers: 1,
    maxDossiers: 10,
    maxStorageGb: 1,
    aiBudgetEur: 0.5,
  },
  SOLO: {
    name: 'Solo',
    priceMonthly: 29,
    priceYearly: 278,   // 29 * 12 * 0.80 (20% remise annuelle)
    dbName: 'solo',
    trialDays: 14,
    maxUsers: 1,
    maxDossiers: 50,
    maxStorageGb: 5,
    aiBudgetEur: 5,
  },
  CABINET: {
    name: 'Cabinet',
    priceMonthly: 79,
    priceYearly: 758,   // 79 * 12 * 0.80
    dbName: 'cabinet',
    trialDays: 14,
    maxUsers: 5,
    maxDossiers: 300,
    maxStorageGb: 50,
    aiBudgetEur: 15,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceMonthly: 199,
    priceYearly: 1910,  // 199 * 12 * 0.80
    dbName: 'enterprise',
    trialDays: 14,
    maxUsers: 20,
    maxDossiers: 1000,
    maxStorageGb: 200,
    aiBudgetEur: 40,
  },
};

/** Stripe price IDs — configurés via variables d'environnement */
const STRIPE_PRICE_ENV: Record<ProductTier, { monthly: string; yearly: string }> = {
  PILOT: {
    monthly: process.env.STRIPE_PRICE_PILOT_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PILOT_YEARLY || '',
  },
  SOLO: {
    monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_SOLO_YEARLY || '',
  },
  CABINET: {
    monthly: process.env.STRIPE_PRICE_CABINET_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_CABINET_YEARLY || '',
  },
  ENTERPRISE: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
  },
};

export function getStripePriceId(tier: ProductTier, cycle: BillingCycle = 'monthly'): string {
  const prices = STRIPE_PRICE_ENV[tier];
  const priceId = cycle === 'yearly' ? prices.yearly : prices.monthly;
  if (!priceId) {
    // Fallback convention pour dev local
    return `price_${PRODUCT_TIERS[tier].dbName}_${cycle}`;
  }
  return priceId;
}

export function getPlanPrice(tier: ProductTier, cycle: BillingCycle = 'monthly'): number {
  const plan = PRODUCT_TIERS[tier];
  return cycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
}

export function getPlanPriceCents(tier: ProductTier, cycle: BillingCycle = 'monthly'): number {
  return getPlanPrice(tier, cycle) * 100;
}

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

export function resolveProductTier(plan?: string): ProductTier {
  const dbName = resolvePlanDbName(plan);
  const entry = Object.entries(PRODUCT_TIERS).find(([, v]) => v.dbName === dbName);
  return (entry?.[0] as ProductTier) || 'SOLO';
}
