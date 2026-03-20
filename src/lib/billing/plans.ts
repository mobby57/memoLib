export type ProductTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export const PRODUCT_TIERS: Record<ProductTier, {
    name: string;
    priceMonthly: number;
    priceYearly: number;
    features: string[];
}> = {
    FREE: {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        features: [
            'Up to 50 documents',
            'Community support',
        ],
    },
    PRO: {
        name: 'Pro',
        priceMonthly: 29,
        priceYearly: 299,
        features: [
            'Advanced collaboration',
            'Priority support',
        ],
    },
    ENTERPRISE: {
        name: 'Enterprise',
        priceMonthly: 99,
        priceYearly: 999,
        features: [
            'Unlimited usage',
            'Dedicated success manager',
        ],
    },
};