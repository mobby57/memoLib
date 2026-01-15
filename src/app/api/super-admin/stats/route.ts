import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;

    // Seul le super admin peut accéder à ces statistiques
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    // Statistiques globales de la plateforme
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalDossiers,
      totalFactures,
      revenus
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      prisma.dossier.count(),
      prisma.facture.count(),
      prisma.facture.aggregate({
        where: { statut: 'payee' },
        _sum: { montant: true }
      })
    ]);

    // Calcul de la croissance mensuelle
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const newTenantsThisMonth = await prisma.tenant.count({
      where: {
        createdAt: { gte: lastMonth }
      }
    });

    return NextResponse.json({
      totalTenants,
      activeTenants,
      totalUsers,
      totalRevenue: revenus._sum.montant || 0,
      monthlyGrowth: newTenantsThisMonth,
      // Métriques supplémentaires
      totalDossiers,
      totalFactures,
      averageRevenuePerTenant: activeTenants > 0 ? (revenus._sum.montant || 0) / activeTenants : 0
    });

  } catch (error) {
    console.error('Erreur API super admin stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}