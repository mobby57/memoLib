import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as { role?: string };

    // Seul le super admin peut acceder a ces statistiques
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
    }

    // Statistiques globales de la plateforme
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalDossiers,
      totalFactures,
      facturesStats,
      totalEmails,
      totalWorkflows
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
      prisma.dossier.count(),
      prisma.facture.count(),
      prisma.facture.aggregate({
        _sum: { montantTTC: true },
        where: { statut: 'payee' }
      }),
      prisma.email.count(),
      prisma.workflowExecution.count()
    ]);

    // Calcul de la croissance mensuelle
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const newTenantsThisMonth = await prisma.tenant.count({
      where: {
        createdAt: { gte: lastMonth }
      }
    });

    const totalRevenue = facturesStats._sum.montantTTC || 0;
    const averageRevenuePerTenant = totalTenants > 0 ? totalRevenue / totalTenants : 0;

    return NextResponse.json({
      totalTenants,
      activeTenants,
      totalUsers,
      totalRevenue,
      monthlyGrowth: newTenantsThisMonth,
      totalDossiers,
      totalFactures,
      totalEmails,
      totalWorkflows,
      averageRevenuePerTenant
    });

  } catch (error) {
    console.error('Erreur API super admin stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
