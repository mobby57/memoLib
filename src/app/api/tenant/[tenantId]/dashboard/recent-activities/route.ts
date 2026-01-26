import { NextRequest, NextResponse } from 'next/server';
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
    const [recentDossiers, recentFactures, recentClients] = await Promise.all([
      prisma.dossier.findMany({
        where: { tenantId: params.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, numero: true, typeDossier: true, createdAt: true, statut: true }
      }),
      prisma.facture.findMany({
        where: { tenantId: params.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, numero: true, montantTTC: true, createdAt: true, statut: true }
      }),
      prisma.client.findMany({
        where: { tenantId: params.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { id: true, firstName: true, lastName: true, createdAt: true }
      })
    ]);

    const activities = [
      ...recentDossiers.map(d => ({
        id: d.id,
        type: 'dossier' as const,
        title: `Dossier ${d.numero} - ${d.typeDossier}`,
        date: d.createdAt.toISOString(),
        status: d.statut === 'en_cours' ? 'info' as const : 'success' as const
      })),
      ...recentFactures.map(f => ({
        id: f.id,
        type: 'facture' as const,
        title: `Facture ${f.numero} - ${f.montantTTC}€`,
        date: f.createdAt.toISOString(),
        status: f.statut === 'payee' ? 'success' as const : 'warning' as const
      })),
      ...recentClients.map(c => ({
        id: c.id,
        type: 'client' as const,
        title: `Nouveau client: ${c.firstName} ${c.lastName}`,
        date: c.createdAt.toISOString(),
        status: 'info' as const
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Erreur recent-activities:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
