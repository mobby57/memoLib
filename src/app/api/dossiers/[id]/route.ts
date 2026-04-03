import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { cacheThrough, cacheDelete } from '@/lib/cache';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dossiers/[id]
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string | undefined;

    if (!tenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const dossier = await cacheThrough(
      `dossier:${tenantId}:${dossierId}`,
      async () => {
        return prisma.dossier.findFirst({
          where: { id: dossierId, tenantId },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            documents: {
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
            emails: {
              orderBy: { receivedAt: 'desc' },
              take: 20,
            },
            legalDeadlines: {
              orderBy: { dueDate: 'asc' },
            },
            _count: {
              select: {
                documents: true,
                emails: true,
                legalDeadlines: true,
              },
            },
          },
        });
      },
      'WARM'
    );

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ dossier });
  } catch (error) {
    logger.error('Erreur GET dossier', error instanceof Error ? error : undefined, {
      route: '/api/dossiers/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/dossiers/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { tenantId: _ignoredTenantId, ...updateData } = body;

    const existing = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    const dossier = await prisma.dossier.update({
      where: { id: dossierId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await cacheDelete(`dossier:${tenantId}:${dossierId}`);

    return NextResponse.json({ dossier, message: 'Dossier mis à jour' });
  } catch (error) {
    logger.error('Erreur PATCH dossier', error instanceof Error ? error : undefined, {
      route: '/api/dossiers/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/dossiers/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete && !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const existing = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    if (hardDelete) {
      await prisma.dossier.delete({
        where: { id: dossierId },
      });
    } else {
      await prisma.dossier.update({
        where: { id: dossierId },
        data: { statut: 'archive' },
      });
    }

    await cacheDelete(`dossier:${tenantId}:${dossierId}`);

    return NextResponse.json({
      message: hardDelete ? 'Dossier supprimé définitivement' : 'Dossier archivé',
      deleted: hardDelete,
      archived: !hardDelete,
    });
  } catch (error) {
    logger.error('Erreur DELETE dossier', error instanceof Error ? error : undefined, {
      route: '/api/dossiers/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
