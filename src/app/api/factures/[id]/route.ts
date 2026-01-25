/**
 * API Route - Facture by ID
 * GET /api/factures/[id] - Récupère une facture
 * PATCH /api/factures/[id] - Met à jour une facture
 * DELETE /api/factures/[id] - Supprime/Annule une facture
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCache, invalidateByPrefix, CACHE_TTL } from '@/lib/cache';
import { createServerLogger } from '@/lib/server-logger';

const logger = createServerLogger('api-factures-id');

// Types
interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Récupérer une facture par ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID facture requis' }, { status: 400 });
    }

    // Cache key
    const cacheKey = `facture:${id}`;

    const facture = await withCache(
      cacheKey,
      async () => {
        // Vérifie que le modèle existe
        const factureData = await (prisma as any).invoice?.findUnique({
          where: { id },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
                phone: true,
              },
            },
            dossier: {
              select: {
                id: true,
                number: true,
                title: true,
                status: true,
              },
            },
            items: true,
          },
        });

        if (!factureData) {
          return null;
        }

        // Transformer la réponse
        return {
          id: factureData.id,
          numero: factureData.number,
          reference: factureData.reference,
          client: factureData.client ? {
            id: factureData.client.id,
            nom: factureData.client.name,
            email: factureData.client.email,
            adresse: factureData.client.address,
            telephone: factureData.client.phone,
          } : null,
          dossier: factureData.dossier ? {
            id: factureData.dossier.id,
            numero: factureData.dossier.number,
            titre: factureData.dossier.title,
            statut: factureData.dossier.status,
          } : null,
          lignes: factureData.items?.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantite: item.quantity,
            prixUnitaire: item.unitPrice,
            montantHT: item.amount,
          })) || [],
          montantHT: factureData.amountHT || 0,
          tauxTVA: factureData.taxRate || 20,
          montantTVA: factureData.taxAmount || 0,
          montantTTC: factureData.amountTTC || factureData.amount || 0,
          statut: factureData.status?.toLowerCase() || 'brouillon',
          dateEmission: factureData.issuedAt || factureData.createdAt,
          dateEcheance: factureData.dueDate,
          datePaiement: factureData.paidAt,
          modePaiement: factureData.paymentMethod,
          notes: factureData.notes,
          conditions: factureData.terms,
          createdAt: factureData.createdAt,
          updatedAt: factureData.updatedAt,
        };
      },
      { ttl: CACHE_TTL.WARM }
    );

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    return NextResponse.json(facture);
  } catch (error) {
    logger.error('Erreur GET facture:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une facture
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID facture requis' }, { status: 400 });
    }

    const body = await request.json();

    // Vérifier que la facture existe
    const existingFacture = await (prisma as any).invoice?.findUnique({
      where: { id },
    });

    if (!existingFacture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, any> = {};

    // Mapper les champs français vers anglais
    if (body.statut !== undefined) {
      updateData.status = body.statut.toUpperCase();
    }
    if (body.dateEcheance !== undefined) {
      updateData.dueDate = new Date(body.dateEcheance);
    }
    if (body.datePaiement !== undefined) {
      updateData.paidAt = body.datePaiement ? new Date(body.datePaiement) : null;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.conditions !== undefined) {
      updateData.terms = body.conditions;
    }
    if (body.montantHT !== undefined) {
      updateData.amountHT = body.montantHT;
    }
    if (body.tauxTVA !== undefined) {
      updateData.taxRate = body.tauxTVA;
    }
    if (body.montantTVA !== undefined) {
      updateData.taxAmount = body.montantTVA;
    }
    if (body.montantTTC !== undefined) {
      updateData.amountTTC = body.montantTTC;
      updateData.amount = body.montantTTC;
    }

    // Mettre à jour
    const updatedFacture = await (prisma as any).invoice?.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Invalider le cache
    await invalidateByPrefix(`facture:${id}`);
    await invalidateByPrefix('factures:');
    await invalidateByPrefix('dashboard:');

    // Log l'action
    logger.info(`Facture ${id} mise à jour par ${session.user.id}`, {
      factureId: id,
      userId: session.user.id,
      changes: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      facture: updatedFacture,
    });
  } catch (error) {
    logger.error('Erreur PATCH facture:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer/Annuler une facture
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID facture requis' }, { status: 400 });
    }

    const url = new URL(request.url);
    const hardDelete = url.searchParams.get('hard') === 'true';

    // Vérifier que la facture existe
    const existingFacture = await (prisma as any).invoice?.findUnique({
      where: { id },
    });

    if (!existingFacture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    if (hardDelete) {
      // Suppression définitive (admin uniquement)
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      await (prisma as any).invoice?.delete({
        where: { id },
      });

      logger.warn(`Facture ${id} supprimée définitivement par ${session.user.id}`);
    } else {
      // Annulation (soft delete)
      await (prisma as any).invoice?.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: session.user.id,
        },
      });

      logger.info(`Facture ${id} annulée par ${session.user.id}`);
    }

    // Invalider le cache
    await invalidateByPrefix(`facture:${id}`);
    await invalidateByPrefix('factures:');
    await invalidateByPrefix('dashboard:');

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Facture supprimée' : 'Facture annulée',
    });
  } catch (error) {
    logger.error('Erreur DELETE facture:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
