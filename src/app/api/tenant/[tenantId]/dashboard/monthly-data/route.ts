import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const { tenantId } = params;

    // Vérifications d'accès
    if (user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    if (user.role === 'ADMIN' && user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Accès interdit - Mauvais tenant' }, { status: 403 });
    }

    // Générer les 6 derniers mois
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = month.toLocaleDateString('fr-FR', { month: 'short' });
      
      // Compter uniquement ce qui est nécessaire pour les graphiques
      const [dossiersCount, facturesCount, revenusSum] = await Promise.all([
        prisma.dossier.count({
          where: {
            tenantId,
            createdAt: {
              gte: month,
              lt: nextMonth
            }
          }
        }),
        prisma.facture.count({
          where: {
            tenantId,
            createdAt: {
              gte: month,
              lt: nextMonth
            }
          }
        }),
        prisma.facture.aggregate({
          where: {
            tenantId,
            statut: 'payee',
            createdAt: {
              gte: month,
              lt: nextMonth
            }
          },
          _sum: { montant: true }
        })
      ]);

      monthlyData.push({
        month: monthName,
        dossiers: dossiersCount,
        factures: facturesCount,
        revenus: revenusSum._sum.montant || 0
      });
    }

    return NextResponse.json(monthlyData);

  } catch (error) {
    logger.error('Erreur API monthly data', { error, tenantId: params.tenantId });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
