import Stripe from 'stripe';
import { PRODUCT_TIERS, type ProductTier } from '@/lib/billing/plans';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY non definie au build: fallback test key utilisee.');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET non definie au build: fallback placeholder utilise.');
}

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY?.trim() || 'sk_test_placeholder';

export const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2026-01-28.clover',
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim() || 'whsec_placeholder';

export { PRODUCT_TIERS };
export type { ProductTier };
