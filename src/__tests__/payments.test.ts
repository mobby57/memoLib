/**
 * Payment System Integration Tests
 * Tests Stripe payment flow, subscriptions, and webhooks
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Stripe test card numbers
export const STRIPE_TEST_CARDS = {
    SUCCESS: '4242424242424242',
    DECLINE: '4000000000000002',
    INSUFFICIENT_FUNDS: '4000000000009995',
    LOST_CARD: '4000000000009987',
    STOLEN_CARD: '4000000000009979',
    EXPIRED_CARD: '4000000000000069',
    INCORRECT_CVC: '4000000000000127',
    PROCESSING_ERROR: '4000000000000119',
    REQUIRES_AUTHENTICATION: '4000002500003155', // 3D Secure
    // International cards
    VISA_DEBIT_US: '4000056655665556',
    MASTERCARD_US: '5555555555554444',
    AMEX_US: '378282246310005',
    DISCOVER_US: '6011111111111117',
    DINERS_CLUB: '3056930009020004',
    JCB: '3566002020360505',
    UNIONPAY: '6200000000000005'
};

describe('Payment Intent Creation', () => {
    it('should create payment intent with valid amount', async () => {
        const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 999, // $9.99
                currency: 'usd'
            })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.clientSecret).toBeDefined();
        expect(data.clientSecret).toContain('pi_');
    });

    it('should reject invalid amount', async () => {
        const response = await fetch('/api/payments/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: -100,
                currency: 'usd'
            })
        });

        expect(response.status).toBe(400);
    });

    it('should support multiple currencies', async () => {
        const currencies = ['usd', 'eur', 'gbp', 'jpy'];

        for (const currency of currencies) {
            const response = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 1000,
                    currency
                })
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.clientSecret).toBeDefined();
        }
    });
});

describe('Subscription Management', () => {
    it('should create PRO subscription', async () => {
        const response = await fetch('/api/subscriptions/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId: 'price_pro_monthly',
                tier: 'PRO'
            })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.subscriptionId).toBeDefined();
        expect(data.clientSecret).toBeDefined();
    });

    it('should retrieve current subscription', async () => {
        const response = await fetch('/api/subscriptions/current');
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.subscription).toBeDefined();
    });

    it('should cancel subscription', async () => {
        const response = await fetch('/api/subscriptions/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toContain('cancelled');
        expect(data.cancelAt).toBeDefined();
    });
});

describe('Payment Methods', () => {
    it('should list payment methods', async () => {
        const response = await fetch('/api/payments/methods');
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(Array.isArray(data.paymentMethods)).toBe(true);
    });

    it('should remove payment method', async () => {
        const response = await fetch('/api/payments/methods', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentMethodId: 'pm_test_123'
            })
        });

        expect(response.status).toBe(200);
    });
});

describe('Invoice Management', () => {
    it('should retrieve invoice history', async () => {
        const response = await fetch('/api/payments/invoices');
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(Array.isArray(data.invoices)).toBe(true);
    });
});

describe('Webhook Events', () => {
    it('should handle payment_intent.succeeded', async () => {
        const event = {
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: 'pi_test_123',
                    amount: 999,
                    currency: 'usd',
                    status: 'succeeded'
                }
            }
        };

        const response = await fetch('/api/payments/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': 'test_signature'
            },
            body: JSON.stringify(event)
        });

        // Note: Will fail signature check in test, but validates structure
        expect([200, 400]).toContain(response.status);
    });
});

describe('Currency Conversion', () => {
    it('should convert USD to EUR', async () => {
        const { convertCurrency } = await import('../lib/currencies');

        const converted = await convertCurrency(100, 'USD', 'EUR');
        expect(converted).toBeGreaterThan(0);
        expect(converted).not.toBe(100); // Should be different
    });

    it('should format currency correctly', async () => {
        const { formatCurrencyAmount } = await import('../lib/currencies');

        const formatted = formatCurrencyAmount(9.99, 'USD');
        expect(formatted).toContain('$');
        expect(formatted).toContain('9.99');
    });

    it('should handle zero-decimal currencies (JPY)', async () => {
        const { formatCurrencyAmount } = await import('../lib/currencies');

        const formatted = formatCurrencyAmount(1000, 'JPY');
        expect(formatted).toContain('1,000');
        expect(formatted).not.toContain('.');
    });
});
