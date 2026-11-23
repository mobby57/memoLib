import { describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: 'client-id' })) }));
import { POST } from '@/app/api/client/dossiers/[id]/intake/route';

describe('ancienne transmission directe', () => {
  it('refuse la modification directe du dossier', async () => {
    const response = await POST();
    expect(response.status).toBe(410);
  });
});
