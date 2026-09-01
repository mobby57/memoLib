import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    const user = user;

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (user.role !== 'CLIENT' || !user.tenantId || !user.clientId) {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const documents = await prisma.document.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [{ clientId: user.clientId }, { Dossier: { clientId: user.clientId } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Dossier: {
          select: { id: true, numero: true, typeDossier: true },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    logger.error('[CLIENT_VAULT] Listing failed', { error });
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des documents' },
      { status: 500 }
    );
  }
}


