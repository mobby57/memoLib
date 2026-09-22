import { auth } from '@/lib/clerk-auth';
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
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    if ((user as any).tenantId !== tenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
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

      case 'update_dossier_status': {
        const target = await prisma.dossier.findFirst({
          where: { id: data.dossierId, tenantId },
          select: { id: true },
        });
        if (!target) {
          return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
        }
        const updatedDossier = await prisma.dossier.update({
          where: { id: target.id },
          data: {
            statut: data.statut,
            lastActivityAt: new Date()
          }
        });
        return NextResponse.json({ success: true, dossier: updatedDossier });
      }

      case 'mark_echeance_complete': {
        const target = await prisma.echeance.findFirst({
          where: { id: data.echeanceId, dossier: { tenantId } },
          select: { id: true },
        });
        if (!target) {
          return NextResponse.json({ error: 'Échéance non trouvée' }, { status: 404 });
        }
        const updatedEcheance = await prisma.echeance.update({
          where: { id: target.id },
          data: {
            statut: 'termine',
            completedAt: new Date()
          }
        });
        return NextResponse.json({ success: true, echeance: updatedEcheance });
      }

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
