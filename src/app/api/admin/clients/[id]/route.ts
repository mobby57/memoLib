import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;

    if (userRole !== 'AVOCAT' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces reserve aux avocats' }, { status: 403 });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        dossiers: {
          include: {
            documents: true,
            echeances: true,
            factures: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            email: true,
            lastLogin: true,
            status: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });
    }

    const stats = {
      totalDossiers: client.dossiers.length,
      dossiersActifs: client.dossiers.filter(d => d.statut === 'en_cours').length,
      dossiersTermines: client.dossiers.filter(d => d.statut === 'termine').length,
      totalDocuments: client.dossiers.reduce((sum, d) => sum + d.documents.length, 0),
      echeancesProches: client.dossiers.flatMap(d => d.echeances).filter(e => 
        e.dateEcheance && new Date(e.dateEcheance) > new Date() && 
        new Date(e.dateEcheance) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length,
      totalFactures: client.dossiers.reduce((sum, d) => sum + d.factures.length, 0),
      montantTotal: client.dossiers.flatMap(d => d.factures).reduce((sum, f) => sum + (f.montant || 0), 0),
    };

    return NextResponse.json({ client, stats });
  } catch (error) {
    console.error('Erreur recuperation client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
