import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as { user: { tenantId: string | null } } | null,
}));

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: vi.fn(async () => state.session),
}));

import { POST } from '@/app/api/emails/create-dossier/route';
import { PUT } from '@/app/api/drafts/[id]/validate/route';

describe.each([
  ['création depuis email', POST],
  ['validation de brouillon', PUT],
])('%s suspendue', (_name, handler) => {
  beforeEach(() => {
    state.session = null;
  });

  it('refuse une session absente ou sans cabinet', async () => {
    expect((await handler()).status).toBe(401);
    state.session = { user: { tenantId: null } };
    expect((await handler()).status).toBe(403);
  });

  it('signale la suspension et la vérification manuelle des échéances', async () => {
    state.session = { user: { tenantId: 'tenant-a' } };
    const response = await handler();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: expect.stringMatching(/temporairement indisponible.*échéances manuellement/i),
    });
  });
});
