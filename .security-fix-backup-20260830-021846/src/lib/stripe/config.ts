import Stripe from 'stripe';
import { PRODUCT_TIERS, type ProductTier } from '@/lib/billing/plans';

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2026-01-28.clover',
});

export const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET?.trim();

export { PRODUCT_TIERS };
export type { ProductTier };
