/**
 * Tests unitaires pour le client Stripe
 * @jest-environment node
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock Stripe avant l'import du module
const mockCreate = jest.fn();
const mockStripeConstructor = jest.fn().mockImplementation(() => ({
  customers: { create: mockCreate },
  subscriptions: { create: mockCreate },
  checkout: { sessions: { create: mockCreate } },
  billingPortal: { sessions: { create: mockCreate } },
  prices: { list: mockCreate },
  invoices: { list: mockCreate, retrieveUpcoming: mockCreate },
  paymentIntents: { retrieve: mockCreate },
}));

jest.mock('stripe', () => ({
  __esModule: true,
  default: mockStripeConstructor,
}));

// Importer après le mock
import {
  createStripeCustomer,
  createStripeSubscription,
  createCheckoutSession,
} from '@/lib/billing/stripe-client';

describe('stripe-client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createStripeCustomer', () => {
    it('devrait créer un client avec les bons paramètres', async () => {
      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
        name: 'Test User',
        metadata: { tenantId: 'tenant_123' },
      };
      mockCreate.mockResolvedValueOnce(mockCustomer);

      const result = await createStripeCustomer({
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant_123',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: { tenantId: 'tenant_123' },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('devrait inclure les metadata personnalisées', async () => {
      const mockCustomer = {
        id: 'cus_456',
        metadata: { tenantId: 'tenant_456', source: 'signup' },
      };
      mockCreate.mockResolvedValueOnce(mockCustomer);

      await createStripeCustomer({
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant_456',
        metadata: { source: 'signup' },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: { tenantId: 'tenant_456', source: 'signup' },
      });
    });

    it('devrait propager les erreurs Stripe', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Stripe API error'));

      await expect(
        createStripeCustomer({
          email: 'test@example.com',
          name: 'Test User',
          tenantId: 'tenant_123',
        })
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('createStripeSubscription', () => {
    it('devrait créer un abonnement avec les bons paramètres', async () => {
      const mockSubscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'trialing',
      };
      mockCreate.mockResolvedValueOnce(mockSubscription);

      const result = await createStripeSubscription({
        customerId: 'cus_123',
        priceId: 'price_123',
        trialDays: 14,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          items: [{ price: 'price_123' }],
          trial_period_days: 14,
          payment_behavior: 'default_incomplete',
        })
      );
      expect(result).toEqual(mockSubscription);
    });

    it('devrait fonctionner sans période d\'essai', async () => {
      mockCreate.mockResolvedValueOnce({ id: 'sub_456' });

      await createStripeSubscription({
        customerId: 'cus_456',
        priceId: 'price_456',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_456',
          items: [{ price: 'price_456' }],
        })
      );
    });
  });

  describe('createCheckoutSession', () => {
    it('devrait créer une session checkout avec customerId', async () => {
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/...',
      };
      mockCreate.mockResolvedValueOnce(mockSession);

      const result = await createCheckoutSession({
        priceId: 'price_pro',
        customerId: 'cus_123',
        tenantId: 'tenant_123',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer: 'cus_123',
          line_items: [{ price: 'price_pro', quantity: 1 }],
          success_url: 'https://app.com/success',
          cancel_url: 'https://app.com/cancel',
        })
      );
      expect(result).toEqual(mockSession);
    });

    it('devrait créer une session avec email si pas de customerId', async () => {
      mockCreate.mockResolvedValueOnce({ id: 'cs_456' });

      await createCheckoutSession({
        priceId: 'price_starter',
        customerEmail: 'new@example.com',
        tenantId: 'tenant_456',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
        trialDays: 7,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'new@example.com',
          subscription_data: expect.objectContaining({
            trial_period_days: 7,
          }),
        })
      );
    });
  });
});
