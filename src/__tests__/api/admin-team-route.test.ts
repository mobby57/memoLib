import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  getSecurePrisma: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}));

import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { PATCH, POST } from '@/app/api/admin/team/route';
import { getSecurePrisma } from '@/lib/prisma';

const prisma = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  tenant: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

function sessionFor(role: string) {
  return {
    user: {
      id: 'actor-id',
      name: 'Actor',
      email: 'actor@example.com',
      role,
      tenantId: 'tenant-id',
      tenantName: 'Tenant',
      clientId: null,
    },
  };
}

describe('API /api/admin/team role authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSecurePrisma).mockResolvedValue(prisma as never);
    vi.mocked(getServerSessionCompat).mockResolvedValue(sessionFor('AVOCAT'));
  });

  it('does not let AVOCAT invite a member with an assigned role', async () => {
    const request = new Request('http://localhost/api/admin/team', {
      method: 'POST',
      body: JSON.stringify({
        email: 'member@example.com',
        name: 'Member',
        memberRole: 'COLLABORATEUR',
      }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('does not let AVOCAT assign or change a role', async () => {
    const request = new Request('http://localhost/api/admin/team', {
      method: 'PATCH',
      body: JSON.stringify({ memberId: 'member-id', newRole: 'COLLABORATEUR' }),
    });

    const response = await PATCH(request as never);

    expect(response.status).toBe(403);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('allows AVOCAT to change a member status without changing the role', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'member-id' });
    prisma.user.update.mockResolvedValue({
      id: 'member-id',
      name: 'Member',
      email: 'member@example.com',
      role: 'COLLABORATEUR',
      status: 'inactive',
    });

    const request = new Request('http://localhost/api/admin/team', {
      method: 'PATCH',
      body: JSON.stringify({ memberId: 'member-id', status: 'inactive' }),
    });

    const response = await PATCH(request as never);

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'inactive' } })
    );
  });

  it('allows ADMIN to assign a role', async () => {
    vi.mocked(getServerSessionCompat).mockResolvedValue(sessionFor('ADMIN'));
    prisma.user.findFirst.mockResolvedValue({ id: 'member-id' });
    prisma.user.update.mockResolvedValue({
      id: 'member-id',
      name: 'Member',
      email: 'member@example.com',
      role: 'ASSOCIE',
      status: 'active',
    });

    const request = new Request('http://localhost/api/admin/team', {
      method: 'PATCH',
      body: JSON.stringify({ memberId: 'member-id', newRole: 'ASSOCIE' }),
    });

    const response = await PATCH(request as never);

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: 'ASSOCIE' } })
    );
  });
});
