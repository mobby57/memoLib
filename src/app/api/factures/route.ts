import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';

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
    console.error('Erreur GET factures:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une facture
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

    // Générer le numéro de facture
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
    const lignesProcessed = lignes.map((ligne: { description: string; quantite?: number; prixUnitaire: number }, index: number) => {
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
    });

    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;

    // Créer la facture avec les lignes
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
        dateEcheance: dateEcheance ? new Date(dateEcheance) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

    // Notifier si demandé
    if (notifyUserId) {
      await NotificationService.factureCreated(notifyUserId, {
        numero: facture.numero,
        montant: facture.montantTTC,
        factureId: facture.id,
      });
    }

    return NextResponse.json({ success: true, facture });
  } catch (error) {
    console.error('Erreur POST facture:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour le statut d'une facture
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
    });

    return NextResponse.json({ success: true, facture });
  } catch (error) {
    console.error('Erreur PATCH facture:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
