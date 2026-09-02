import Stripe from 'stripe';
import { PRODUCT_TIERS, type ProductTier } from '@/lib/billing/plans';

// N'affiche pas ces avertissements pendant le build (les secrets ne sont pas injectés en CI).
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
if (!isBuildPhase && !process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY non définie : clé de test utilisée en fallback.');
}
if (!isBuildPhase && !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET non définie : placeholder utilisé en fallback.');
}

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY?.trim() || 'sk_test_placeholder';

export const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: '2026-02-25.clover',
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim() || 'whsec_placeholder';

export { PRODUCT_TIERS };
export type { ProductTier };
