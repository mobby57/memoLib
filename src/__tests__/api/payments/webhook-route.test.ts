/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockParseStripeWebhookRequest = jest.fn();
const mockIsStripeEventDuplicate = jest.fn();
const mockLogStripeWebhookProcessingFailure = jest.fn();
const mockTransaction = jest.fn();

jest.mock('@/lib/stripe/config', () => ({
  stripe: {},
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
  },
}));

jest.mock('@/lib/stripe/webhook', () => ({
  parseStripeWebhookRequest: mockParseStripeWebhookRequest,
  isStripeEventDuplicate: mockIsStripeEventDuplicate,
  logStripeWebhookProcessingFailure: mockLogStripeWebhookProcessingFailure,
}));

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns duplicate=true when the replay cache already knows the event', async () => {
    mockParseStripeWebhookRequest.mockResolvedValue({
      ok: true,
      event: {
        id: 'evt_duplicate_cache',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      },
      body: '{}',
    });
    mockIsStripeEventDuplicate.mockResolvedValue(true);

    const { POST } = await import('@/app/api/payments/webhook/route');
    const response = await POST(
      new NextRequest('http://localhost/api/payments/webhook', { method: 'POST' })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ received: true, duplicate: true });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('returns duplicate=true when the database lock already exists', async () => {
    mockParseStripeWebhookRequest.mockResolvedValue({
      ok: true,
      event: {
        id: 'evt_duplicate_db',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_456' } },
      },
      body: '{}',
    });
    mockIsStripeEventDuplicate.mockResolvedValue(false);
    mockTransaction.mockRejectedValue(
      Object.assign(new Error('Unique constraint failed on stripeEventId'), {
        code: 'P2002',
      })
    );

    const { POST } = await import('@/app/api/payments/webhook/route');
    const response = await POST(
      new NextRequest('http://localhost/api/payments/webhook', { method: 'POST' })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ received: true, duplicate: true });
    expect(mockLogStripeWebhookProcessingFailure).not.toHaveBeenCalled();
  });
});
