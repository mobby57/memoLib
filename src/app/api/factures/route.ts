import { logger } from '@/lib/logger';
import { NotificationService } from '@/lib/notifications';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Liste des factures
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const clientId = searchParams.get('clientId');
    const dossierId = searchParams.get('dossierId');
    const statut = searchParams.get('statut');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const factures = await prisma.facture.findMany({
      where: {
        tenantId,
        ...(clientId ? { clientId } : {}),
        ...(dossierId ? { dossierId } : {}),
        ...(statut ? { statut } : {}),
      },
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true },
        },
        dossier: {
          select: { numero: true, typeDossier: true },
        },
        lignes: true,
        paiements: true,
      },
      orderBy: { dateEmission: 'desc' },
      take: limit,
      skip: offset,
    });

    const stats = await prisma.facture.groupBy({
      by: ['statut'],
      where: { tenantId },
      _count: true,
      _sum: { montantTTC: true },
    });

    return NextResponse.json({ factures, stats });
  } catch (error) {
    logger.error('Erreur GET factures', error instanceof Error ? error : undefined, {
      route: '/api/factures',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Creer une facture
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      clientId,
      dossierId,
      description,
      lignes,
      tauxTVA = 20,
      dateEcheance,
      notes,
      conditions,
      notifyUserId,
    } = body;

    if (!tenantId || !clientId) {
      return NextResponse.json({ error: 'tenantId et clientId requis' }, { status: 400 });
    }

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json({ error: 'Au moins une ligne requise' }, { status: 400 });
    }

    // Generer le numero de facture
    const year = new Date().getFullYear();
    const lastFacture = await prisma.facture.findFirst({
      where: {
        tenantId,
        numero: { startsWith: `FAC-${year}` },
      },
      orderBy: { numero: 'desc' },
    });

    let nextNumber = 1;
    if (lastFacture) {
      const match = lastFacture.numero.match(/FAC-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const numero = `FAC-${year}-${nextNumber.toString().padStart(4, '0')}`;

    // Calculer les montants
    let montantHT = 0;
    const lignesProcessed = lignes.map(
      (ligne: { description: string; quantite?: number; prixUnitaire: number }, index: number) => {
        const qte = ligne.quantite || 1;
        const montant = qte * ligne.prixUnitaire;
        montantHT += montant;
        return {
          description: ligne.description,
          quantite: qte,
          prixUnitaire: ligne.prixUnitaire,
          montantHT: montant,
          ordre: index,
        };
      }
    );

    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;

    // Creer la facture avec les lignes
    const facture = await prisma.facture.create({
      data: {
        tenantId,
        clientId,
        dossierId,
        numero,
        description,
        montantHT,
        tauxTVA,
        montantTVA,
        montantTTC,
        dateEcheance: dateEcheance
          ? new Date(dateEcheance)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes,
        conditions,
        statut: 'brouillon',
        lignes: {
          create: lignesProcessed,
        },
      },
      include: {
        client: true,
        lignes: true,
      },
    });

    // Notifier si demande
    if (notifyUserId) {
      await NotificationService.factureCreated(notifyUserId, {
        numero: facture.numero,
        montant: facture.montantTTC,
        factureId: facture.id,
      });
    }

    return NextResponse.json({ success: true, facture });
  } catch (error) {
    logger.error('Erreur POST facture', error instanceof Error ? error : undefined, {
      route: '/api/factures',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre a jour le statut d'une facture
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { factureId, statut, datePaiement, modePaiement, referencePayment } = body;

    if (!factureId || !statut) {
      return NextResponse.json({ error: 'factureId et statut requis' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { statut };

    if (statut === 'payee' && datePaiement) {
      updateData.datePaiement = new Date(datePaiement);
      updateData.modePaiement = modePaiement;
      updateData.referencePayment = referencePayment;
    }

    const facture = await prisma.facture.update({
      where: { id: factureId },
      data: updateData,
      include: {
        client: { select: { firstName: true, lastName: true } },
        dossier: { select: { typeDossier: true } },
      },
    });

    // === AUTO-ÉCRITURES COMPTABLES ===
    try {
      const { AutoEcrituresService } = await import('@/lib/services/comptabilite');
      const clientNom = `${facture.client?.firstName || ''} ${facture.client?.lastName || ''}`.trim();

      // Facture envoyée → écriture de vente
      if (statut === 'envoyee') {
        await AutoEcrituresService.genererEcritureFacture({
          id: facture.id,
          tenantId: facture.tenantId,
          numero: facture.numero,
          montantHT: facture.montantHT,
          tauxTVA: facture.tauxTVA,
          montantTVA: facture.montantTVA,
          montantTTC: facture.montantTTC,
          dateEmission: facture.dateEmission,
          dossierId: facture.dossierId,
          clientNom,
          typeDossier: facture.dossier?.typeDossier,
        });
      }

      // Facture payée → écriture d'encaissement
      if (statut === 'payee') {
        await AutoEcrituresService.genererEcriturePaiement({
          tenantId: facture.tenantId,
          factureId: facture.id,
          factureNumero: facture.numero,
          montant: facture.montantTTC,
          date: datePaiement ? new Date(datePaiement) : new Date(),
          mode: modePaiement || 'virement',
          reference: referencePayment,
          clientNom,
        });
      }
    } catch (comptaError) {
      // Ne pas bloquer la facture si la compta échoue (module optionnel)
      logger.error('Auto-écriture comptable échouée', comptaError instanceof Error ? comptaError : undefined, {
        factureId,
        statut,
      });
    }

    return NextResponse.json({ success: true, facture });
  } catch (error) {
    logger.error('Erreur PATCH facture', error instanceof Error ? error : undefined, {
      route: '/api/factures',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
