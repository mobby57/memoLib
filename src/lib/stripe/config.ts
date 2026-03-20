import Stripe from 'stripe';
import { PRODUCT_TIERS, type ProductTier } from '@/lib/billing/plans';

if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY est requise en production');
}
if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET est requise en production');
}

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder';

export const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2026-01-28.clover',
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_placeholder';

export { PRODUCT_TIERS };
export type { ProductTier };
