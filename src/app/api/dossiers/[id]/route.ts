// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import prisma, { withTenantContext } from '@/lib/prisma';
import { cacheDelete } from '@/lib/cache';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dossiers/[id]
 * RÃ©cupÃ¨re un dossier spÃ©cifique par son ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }
    const tenantId = session.user.tenantId;

    if (!tenantId || !['ADMIN', 'AVOCAT', 'ASSOCIE', 'COLLABORATEUR', 'SECRETAIRE', 'COMPTABLE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    const dossier = await withTenantContext(tenantId, transaction =>
        transaction.dossier.findFirst({
          where: { id: dossierId, tenantId },
          include: {
            Client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            Document: {
              orderBy: { createdAt: 'desc' },
              take: 50,
              select: {
                id: true,
                originalName: true,
                category: true,
                antivirusStatus: true,
                createdAt: true,
              },
            },
            LegalDeadline: {
              orderBy: { dueDate: 'asc' },
            },
          },
        })
    );

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvÃ©' }, { status: 404 });
    }

    const { Client, Document, LegalDeadline, ...fields } = dossier;
    return NextResponse.json(
      { dossier: { ...fields, client: Client, documents: Document, delais: LegalDeadline } },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    logger.error('Erreur GET dossier', new Error(error instanceof Error ? error.name : 'UnknownError'), {
      route: '/api/dossiers/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/dossiers/[id]
 * Met Ã  jour un dossier existant
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    const body = await request.json();
    const { tenantId: _ignoredTenantId, ...updateData } = body;

    // VÃ©rifier que le dossier existe
    const existing = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier non trouvÃ©' }, { status: 404 });
    }

    // Mettre Ã  jour le dossier
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

    // CrÃ©er un Ã©vÃ©nement de modification
    await prisma.evenement.create({
      data: {
        tenantId,
        dossierId,
        clientId: dossier.clientId,
        type: 'action',
        categorie: 'modification_dossier',
        titre: 'Dossier modifiÃ©',
        description: `Le dossier ${dossier.numero} a Ã©tÃ© modifiÃ©`,
        dateEvenement: new Date(),
      },
    });

    // Invalider le cache
    await cacheDelete(`dossier:${tenantId}:${dossierId}`);

    return NextResponse.json({ dossier, message: 'Dossier mis Ã  jour' });
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
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }
    const tenantId = (session.user as any).tenantId as string | undefined;
    if (!tenantId) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete && !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    // VÃ©rifier que le dossier existe
    const existing = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier non trouvÃ©' }, { status: 404 });
    }

    if (hardDelete) {
      // Suppression dÃ©finitive (admin uniquement)
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

      // CrÃ©er un Ã©vÃ©nement d'archivage
      await prisma.evenement.create({
        data: {
          tenantId,
          dossierId,
          clientId: existing.clientId,
          type: 'action',
          categorie: 'archivage_dossier',
          titre: 'Dossier archivÃ©',
          description: `Le dossier ${existing.numero} a Ã©tÃ© archivÃ©`,
          dateEvenement: new Date(),
        },
      });
    }

    // Invalider le cache
    await cacheDelete(`dossier:${tenantId}:${dossierId}`);

    return NextResponse.json({
      message: hardDelete ? 'Dossier supprimÃ© dÃ©finitivement' : 'Dossier archivÃ©',
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

