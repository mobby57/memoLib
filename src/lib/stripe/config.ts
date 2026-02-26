import Stripe from 'stripe';

export type ProductTier = 'FREE' | 'PRO' | 'ENTERPRISE';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder';

export const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2026-01-28.clover',
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_placeholder';

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
