import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cacheThrough, cacheDelete, TTL_TIERS } from '@/lib/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clients/[id]
 * Récupère un client spécifique par son ID avec ses dossiers et factures
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const includeDossiers = searchParams.get('includeDossiers') !== 'false';
    const includeFactures = searchParams.get('includeFactures') !== 'false';

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const cacheKey = `client:${tenantId}:${clientId}:full`;

    const client = await cacheThrough(
      cacheKey,
      async () => {
        return prisma.client.findFirst({
          where: { id: clientId, tenantId },
          include: {
            dossiers: includeDossiers ? {
              orderBy: { createdAt: 'desc' },
              take: 20,
              select: {
                id: true,
                numero: true,
                titre: true,
                type: true,
                status: true,
                priorite: true,
                createdAt: true,
                updatedAt: true,
              },
            } : false,
            factures: includeFactures ? {
              orderBy: { dateEmission: 'desc' },
              take: 20,
              select: {
                id: true,
                numero: true,
                montantHT: true,
                montantTTC: true,
                statut: true,
                dateEmission: true,
                dateEcheance: true,
              },
            } : false,
            _count: {
              select: {
                dossiers: true,
                factures: true,
                documents: true,
                evenements: true,
              },
            },
          },
        });
      },
      TTL_TIERS.WARM
    );

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Calculer les statistiques
    const stats = {
      totalDossiers: client._count.dossiers,
      totalFactures: client._count.factures,
      totalDocuments: client._count.documents,
    };

    return NextResponse.json({ client, stats });
  } catch (error) {
    console.error('Erreur GET client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/clients/[id]
 * Met à jour un client existant
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();
    const { tenantId, ...updateData } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    // Vérifier que le client existe
    const existing = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Mettre à jour le client
    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    // Créer un événement de modification
    await prisma.evenement.create({
      data: {
        tenantId,
        clientId,
        type: 'action',
        categorie: 'modification_client',
        titre: 'Client modifié',
        description: `Le client ${client.firstName} ${client.lastName} a été modifié`,
        dateEvenement: new Date(),
      },
    });

    // Invalider le cache
    await cacheDelete(`client:${tenantId}:${clientId}:full`);

    return NextResponse.json({ client, message: 'Client mis à jour' });
  } catch (error) {
    console.error('Erreur PATCH client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]
 * Supprime un client (soft delete via désactivation)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const hardDelete = searchParams.get('hard') === 'true';

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    // Vérifier que le client existe
    const existing = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        _count: { select: { dossiers: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    // Vérifier si le client a des dossiers actifs
    if (existing._count.dossiers > 0 && hardDelete) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un client avec des dossiers actifs' },
        { status: 400 }
      );
    }

    if (hardDelete) {
      // Suppression définitive (admin uniquement, client sans dossiers)
      await prisma.client.delete({
        where: { id: clientId },
      });
    } else {
      // Soft delete : désactivation
      await prisma.client.update({
        where: { id: clientId },
        data: {
          status: 'inactive',
          updatedAt: new Date(),
        },
      });

      // Créer un événement de désactivation
      await prisma.evenement.create({
        data: {
          tenantId,
          clientId,
          type: 'action',
          categorie: 'desactivation_client',
          titre: 'Client désactivé',
          description: `Le client ${existing.firstName} ${existing.lastName} a été désactivé`,
          dateEvenement: new Date(),
        },
      });
    }

    // Invalider le cache
    await cacheDelete(`client:${tenantId}:${clientId}:full`);

    return NextResponse.json({
      message: hardDelete ? 'Client supprimé définitivement' : 'Client désactivé',
      deleted: hardDelete,
      deactivated: !hardDelete,
    });
  } catch (error) {
    console.error('Erreur DELETE client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
