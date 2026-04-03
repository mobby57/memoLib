import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const guard = requireApiPermission(session, RBAC_PERMISSIONS.USERS_READ);
    if (!guard.ok) {
      return guard.response;
    }

    const users = await prisma.user.findMany({
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const usersWithTenantName = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name || null,
      status: user.status,
      createdAt: user.createdAt,
    }));

    return NextResponse.json(usersWithTenantName);
  } catch (error) {
    logger.error('Erreur GET users', error instanceof Error ? error : undefined, {
      route: '/api/super-admin/users',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
