import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).tenantId !== params.tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const data = await Promise.all(
      months.map(async (month, index) => {
        const startDate = new Date(2024, index, 1);
        const endDate = new Date(2024, index + 1, 0);

        const [dossiers, factures, revenus] = await Promise.all([
          prisma.dossier.count({
            where: {
              tenantId: params.tenantId,
              createdAt: { gte: startDate, lte: endDate }
            }
          }),
          prisma.facture.count({
            where: {
              tenantId: params.tenantId,
              dateEmission: { gte: startDate, lte: endDate }
            }
          }),
          prisma.facture.aggregate({
            where: {
              tenantId: params.tenantId,
              dateEmission: { gte: startDate, lte: endDate },
              statut: 'payee'
            },
            _sum: { montantTTC: true }
          })
        ]);

        return {
          month,
          dossiers,
          factures,
          revenus: revenus._sum.montantTTC || 0
        };
      })
    );

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Erreur monthly-data:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
