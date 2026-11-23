import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ session: vi.fn(), scoped: vi.fn(), findFirst: vi.fn() }));
vi.mock('@/lib/auth/getServerSessionCompat', () => ({ getServerSessionCompat: mocks.session }));
vi.mock('@/lib/prisma', () => ({ default: {}, withTenantContext: mocks.scoped }));
vi.mock('@/lib/cache', () => ({ cacheDelete: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { GET } from '@/app/api/dossiers/[id]/route';

const params = { params: Promise.resolve({ id: 'dossier-a' }) };
const request = () => new NextRequest('http://localhost/api/dossiers/dossier-a');

describe('lecture de dossier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue({ user: { tenantId: 'tenant-a', role: 'AVOCAT' } });
    mocks.scoped.mockImplementation(async (_tenantId, operation) => operation({
      dossier: { findFirst: mocks.findFirst },
    }));
    mocks.findFirst.mockResolvedValue({
      id: 'dossier-a', typeDossier: 'TEST', Client: null,
      Document: [{ id: 'form', originalName: 'Formulaire.json', category: 'client-intake' }],
      LegalDeadline: [],
    });
  });

  it('lit le dossier dans son tenant sans mise en cache', async () => {
    const response = await GET(request(), params);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.scoped).toHaveBeenCalledWith('tenant-a', expect.any(Function));
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'dossier-a', tenantId: 'tenant-a' },
    }));
    expect(await response.json()).toMatchObject({
      dossier: { id: 'dossier-a', documents: [{ id: 'form', category: 'client-intake' }] },
    });
  });

  it('refuse la lecture du dossier interne à un client', async () => {
    mocks.session.mockResolvedValue({ user: { tenantId: 'tenant-a', role: 'CLIENT' } });
    expect((await GET(request(), params)).status).toBe(403);
    expect(mocks.scoped).not.toHaveBeenCalled();
  });
});
