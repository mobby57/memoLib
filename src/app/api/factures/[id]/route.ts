/**
 * API Route - Facture by ID
 * GET /api/factures/[id] - RÃ©cupÃ¨re une facture
 * PATCH /api/factures/[id] - Met Ã  jour une facture
 * DELETE /api/factures/[id] - Supprime/Annule une facture
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { getSecurePrisma } from '@/lib/prisma';;
import { cacheGet, cacheSet, cacheDelete, cacheInvalidatePattern, CACHE_TTL } from '@/lib/cache';
import { logger } from '@/lib/logger';

// Types
interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - RÃ©cupÃ©rer une facture par ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID facture requis' }, { status: 400 });
    }

    // Cache key
    const cacheKey = `facture:${id}`;

    // Try cache first
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch from DB
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
          return NextResponse.json({ error: 'Facture non trouvÃ©e' }, { status: 404 });
        }

        // Transformer la rÃ©ponse
        const facture = {
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

    // Cache and return
    await cacheSet(cacheKey, facture, 'WARM');
    return NextResponse.json(facture);
  } catch (error) {
    logger.error('Erreur GET facture:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre Ã  jour une facture
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID facture requis' }, { status: 400 });
    }

    const body = await request.json();

    // VÃ©rifier que la facture existe
    const existingFacture = await (prisma as any).invoice?.findUnique({
      where: { id },
    });

    if (!existingFacture) {
      return NextResponse.json({ error: 'Facture non trouvÃ©e' }, { status: 404 });
    }

    // PrÃ©parer les donnÃ©es de mise Ã  jour
    const updateData: Record<string, any> = {};

    // Mapper les champs franÃ§ais vers anglais
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

    // Mettre Ã  jour
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
    await cacheInvalidatePattern(`facture:${id}`);
    await cacheInvalidatePattern('factures:*');
    await cacheInvalidatePattern('dashboard:*');

    // Log l'action
    logger.info(`Facture ${id} mise Ã  jour par ${session.user.id}`, {
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
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'ID facture requis' }, { status: 400 });
    }

    const url = new URL(request.url);
    const hardDelete = url.searchParams.get('hard') === 'true';

    // VÃ©rifier que la facture existe
    const existingFacture = await (prisma as any).invoice?.findUnique({
      where: { id },
    });

    if (!existingFacture) {
      return NextResponse.json({ error: 'Facture non trouvÃ©e' }, { status: 404 });
    }

    if (hardDelete) {
      // Suppression dÃ©finitive (admin uniquement)
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 403 });
      }

      await (prisma as any).invoice?.delete({
        where: { id },
      });

      logger.warn(`Facture ${id} supprimÃ©e dÃ©finitivement par ${session.user.id}`);
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

      logger.info(`Facture ${id} annulÃ©e par ${session.user.id}`);
    }

    // Invalider le cache
    await cacheInvalidatePattern(`facture:${id}`);
    await cacheInvalidatePattern('factures:*');
    await cacheInvalidatePattern('dashboard:*');

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Facture supprimÃ©e' : 'Facture annulÃ©e',
    });
  } catch (error) {
    logger.error('Erreur DELETE facture:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

