vi.mock("ioredis", () => ({
  default: vi.fn(() => ({
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn().mockResolvedValue(null),
  })),
}));
  default: vi.fn(() => ({
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn().mockResolvedValue(null),
  })),
}));
  default: vi.fn(() => ({
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn().mockResolvedValue(null),
  })),
}));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSet = vi.fn<Promise<string | null>, [string, string, { nx: true; ex: number }]>();

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    set: mockSet,
  })),
}));

describe('Stripe webhook idempotency', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
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
