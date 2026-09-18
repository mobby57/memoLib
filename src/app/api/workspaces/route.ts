import { auth } from '@/lib/clerk-auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (user as any).id;
    const tenantId = (user as any).tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 400 });
    }

    // Recuperer les workspaces du tenant
    const workspaces = await prisma.workspace.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    logger.error(
      'Erreur lors de la recuperation des workspaces',
      error instanceof Error ? error : undefined,
      { route: '/api/workspaces' }
    );
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




