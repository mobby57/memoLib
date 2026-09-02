import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearCache, getCachedResponse, setCachedResponse } from '@/lib/ai/ai-cache';

describe('AI cache tenant isolation', () => {
  afterEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  it('never returns a cached response from another tenant', async () => {
    await setCachedResponse(
      'Classify this legal email',
      'test-model',
      'Tenant A response',
      100,
      'tenant-a'
    );

    await expect(
      getCachedResponse('Classify this legal email', 'test-model', 'tenant-a')
    ).resolves.toMatchObject({
      hit: true,
      response: 'Tenant A response',
    });
    await expect(
      getCachedResponse('Classify this legal email', 'test-model', 'tenant-b')
    ).resolves.toEqual({ hit: false });
  });
});
