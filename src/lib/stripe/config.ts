import Stripe from 'stripe';
import { PRODUCT_TIERS, type ProductTier } from '@/lib/billing/plans';

// Instanciation PARESSEUSE : ne pas construire le client Stripe au chargement du
// module (sinon echec pendant la collecte page-data de `next build` quand
// STRIPE_SECRET_KEY est absente). Construit au premier acces (runtime).
function createRealStripe(): Stripe {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    const canUseStripePlaceholder = isBuildPhase || process.env.NODE_ENV === 'test';
    const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY?.trim();

    if (!STRIPE_SECRET && !canUseStripePlaceholder) {
        throw new Error('STRIPE_SECRET_KEY est obligatoire hors des builds et tests.');
    }

    if (!isBuildPhase && !process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn('STRIPE_WEBHOOK_SECRET non définie : placeholder utilisé en fallback.');
    }

    return new Stripe(STRIPE_SECRET || 'sk_test_placeholder', {
        apiVersion: '2026-02-25.clover',
    });
}

let stripeInstance: Stripe | null = null;

export const stripe: Stripe = new Proxy({} as Stripe, {
    get(_target, prop, receiver) {
        stripeInstance ??= createRealStripe();
        const value = Reflect.get(stripeInstance as object, prop, receiver);
        return typeof value === 'function' ? value.bind(stripeInstance) : value;
    },
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim() || 'whsec_placeholder';

export { PRODUCT_TIERS };
export type { ProductTier };
