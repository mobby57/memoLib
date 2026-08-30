import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/conflicts/check
 * Verifie s'il existe un conflit d'interets avec un nouveau client/dossier.
 * Compare le nom, email, parties adverses dans les dossiers existants.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const user = session.user as any;
  const { clientName, clientEmail, partieAdverse, reference } = await req.json();

  if (!clientName && !clientEmail) {
    return NextResponse.json({ error: 'clientName ou clientEmail requis' }, { status: 400 });
  }

  const conflicts: any[] = [];

  // Chercher si le client est deja partie adverse dans un autre dossier
  if (clientName) {
    const asAdverse = await prisma.dossier.findMany({
      where: {
        tenantId: user.tenantId,
        description: { contains: clientName, mode: 'insensitive' },
      },
      select: { id: true, numero: true, objet: true, client: { select: { nom: true } } },
    });

    for (const d of asAdverse) {
      if (d.client?.nom?.toLowerCase() !== clientName.toLowerCase()) {
        conflicts.push({
          type: 'partie_adverse',
          severity: 'high',
          dossierId: d.id,
          numero: d.numero,
          message: `"${clientName}" apparait dans le dossier ${d.numero} (client: ${d.client?.nom})`,
        });
      }
    }
  }

  // Chercher si la partie adverse est un client existant
  if (partieAdverse) {
    const existingClient = await prisma.client.findFirst({
      where: {
        tenantId: user.tenantId,
        nom: { contains: partieAdverse, mode: 'insensitive' },
      },
      include: { dossiers: { select: { id: true, numero: true } } },
    });

    if (existingClient) {
      conflicts.push({
        type: 'client_existant',
        severity: 'critical',
        clientId: existingClient.id,
        message: `La partie adverse "${partieAdverse}" est un client existant du cabinet (${existingClient.dossiers.length} dossier(s))`,
      });
    }
  }

  return NextResponse.json({
    hasConflict: conflicts.length > 0,
    conflicts,
    message: conflicts.length > 0
      ? `ATTENTION: ${conflicts.length} conflit(s) d'interets detecte(s)`
      : 'Aucun conflit detecte',
  });
}
