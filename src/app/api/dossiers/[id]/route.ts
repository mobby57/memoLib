import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cacheThrough, cacheDelete, TTL_TIERS } from '@/lib/cache';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dossiers/[id]
 * Récupère un dossier spécifique par son ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
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
                type: true,
              },
            },
            documents: {
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
            delais: {
              orderBy: { dateEcheance: 'asc' },
            },
            evenements: {
              orderBy: { dateEvenement: 'desc' },
              take: 50,
            },
            _count: {
              select: {
                documents: true,
                delais: true,
                evenements: true,
              },
            },
          },
        });
      },
      TTL_TIERS.WARM
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
 * Met à jour un dossier existant
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const body = await request.json();
    const { tenantId, ...updateData } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    // Vérifier que le dossier existe
    const existing = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    // Mettre à jour le dossier
    const dossier = await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
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

    // Créer un événement de modification
    await prisma.evenement.create({
      data: {
        tenantId,
        dossierId,
        clientId: dossier.clientId,
        type: 'action',
        categorie: 'modification_dossier',
        titre: 'Dossier modifié',
        description: `Le dossier ${dossier.numero} a été modifié`,
        dateEvenement: new Date(),
      },
    });

    // Invalider le cache
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
 * Supprime un dossier (soft delete via archivage)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const hardDelete = searchParams.get('hard') === 'true';

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    // Vérifier que le dossier existe
    const existing = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    if (hardDelete) {
      // Suppression définitive (admin uniquement)
      await prisma.dossier.delete({
        where: { id: dossierId },
      });
    } else {
      // Soft delete : archivage
      await prisma.dossier.update({
        where: { id: dossierId },
        data: {
          status: 'archive',
          updatedAt: new Date(),
        },
      });

      // Créer un événement d'archivage
      await prisma.evenement.create({
        data: {
          tenantId,
          dossierId,
          clientId: existing.clientId,
          type: 'action',
          categorie: 'archivage_dossier',
          titre: 'Dossier archivé',
          description: `Le dossier ${existing.numero} a été archivé`,
          dateEvenement: new Date(),
        },
      });
    }

    // Invalider le cache
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
