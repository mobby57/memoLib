import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface QuickActionsParams {
  params: { tenantId: string };
}

export async function POST(
  request: NextRequest,
  { params }: QuickActionsParams
) {
  try {
    const { tenantId } = params;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_dossier':
        const dossier = await prisma.dossier.create({
          data: {
            tenantId,
            numero: `D-${Date.now()}`,
            clientId: data.clientId,
            typeDossier: data.typeDossier,
            objet: data.objet,
            statut: 'en_cours',
            priorite: 'normale'
          }
        });
        return NextResponse.json({ success: true, dossier });

      case 'create_facture':
        const facture = await prisma.facture.create({
          data: {
            tenantId,
            numero: `F-${Date.now()}`,
            clientName: data.clientName,
            montant: data.montant,
            dateEcheance: new Date(data.dateEcheance),
            description: data.description
          }
        });
        return NextResponse.json({ success: true, facture });

      case 'update_dossier_status':
        const updatedDossier = await prisma.dossier.update({
          where: { id: data.dossierId },
          data: { 
            statut: data.statut,
            lastActivityAt: new Date()
          }
        });
        return NextResponse.json({ success: true, dossier: updatedDossier });

      case 'mark_echeance_complete':
        const updatedEcheance = await prisma.echeance.update({
          where: { id: data.echeanceId },
          data: { 
            statut: 'termine',
            completedAt: new Date()
          }
        });
        return NextResponse.json({ success: true, echeance: updatedEcheance });

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Erreur quick actions', { error, tenantId: params.tenantId });
    return NextResponse.json(
      { error: 'Erreur lors de l\'execution de l\'action' },
      { status: 500 }
    );
  }
}