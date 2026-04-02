/**
 * @jest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockSet = jest.fn<Promise<string | null>, [string, string, { nx: true; ex: number }]>();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    set: mockSet,
  })),
}));

describe('Stripe webhook idempotency', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('returns false for first event and true for replay with Redis NX', async () => {
    mockSet.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);

    const { isStripeEventDuplicate } = await import('../../lib/stripe/webhook');

    const first = await isStripeEventDuplicate('evt_pci_lock_1');
    const second = await isStripeEventDuplicate('evt_pci_lock_1');

    expect(first).toBe(false);
    expect(second).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenNthCalledWith(
      1,
      'stripe:webhook:event:evt_pci_lock_1',
      '1',
      expect.objectContaining({ nx: true })
    );
  });

  it('falls back to in-memory cache when Redis is unavailable', async () => {
    mockSet.mockRejectedValue(new Error('redis down'));

    const { isStripeEventDuplicate } = await import('../../lib/stripe/webhook');

    const first = await isStripeEventDuplicate('evt_pci_fallback_1');
    const second = await isStripeEventDuplicate('evt_pci_fallback_1');

    expect(first).toBe(false);
    expect(second).toBe(true);
  });
});
