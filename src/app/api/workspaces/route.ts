import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const tenantId = (session.user as any).tenantId;

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
