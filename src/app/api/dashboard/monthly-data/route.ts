import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 400 });
    }

    const now = new Date();
    const monthlyData: Array<{ month: string; dossiers: number; factures: number; revenus: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

      const [dossiersCount, facturesCount, facturesSum] = await Promise.all([
        prisma.dossier.count({
          where: { tenantId, createdAt: { gte: date, lt: nextMonth } },
        }),
        prisma.facture.count({
          where: { tenantId, createdAt: { gte: date, lt: nextMonth } },
        }),
        prisma.facture.aggregate({
          where: { tenantId, createdAt: { gte: date, lt: nextMonth }, statut: 'payee' },
          _sum: { montantTTC: true },
        }),
      ]);

      monthlyData.push({
        month: monthName,
        dossiers: dossiersCount,
        factures: facturesCount,
        revenus: facturesSum._sum?.montantTTC || 0,
      });
    }

    return NextResponse.json(monthlyData);
  } catch (error) {
    logger.error('Erreur recuperation donnees mensuelles', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
