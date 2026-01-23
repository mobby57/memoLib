import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 400 });
    }

    // Calculer les données des 6 derniers mois
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

      // Compter les dossiers créés ce mois
      const dossiersCount = await prisma.dossier.count({
        where: {
          tenantId,
          createdAt: {
            gte: date,
            lt: nextMonth,
          },
        },
      });

      // Compter les factures créées ce mois
      const facturesCount = await prisma.facture.count({
        where: {
          tenantId,
          createdAt: {
            gte: date,
            lt: nextMonth,
          },
        },
      });

      // Calculer les revenus du mois
      const facturesSum = await prisma.facture.aggregate({
        where: {
          tenantId,
          createdAt: {
            gte: date,
            lt: nextMonth,
          },
          statut: 'PAYEE',
        },
        _sum: {
          montant: true,
        },
      });

      monthlyData.push({
        month: monthName,
        dossiers: dossiersCount,
        factures: facturesCount,
        revenus: facturesSum._sum?.montant || 0,
      });
    }

    return NextResponse.json(monthlyData);
  } catch (error) {
    logger.error('Erreur récupération données mensuelles', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
