import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerSessionCompat: vi.fn(),
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: mocks.getServerSessionCompat,
}));

import { POST } from '@/app/api/ocr/extract/route';

describe('/api/ocr/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    mocks.getServerSessionCompat.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('requires authentication', async () => {
    mocks.getServerSessionCompat.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails closed until local OCR processing is verified', async () => {
    const response = await POST();

    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});
