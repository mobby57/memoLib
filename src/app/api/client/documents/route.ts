import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';;
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextResponse } from 'next/server';

export async function GET() {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    if (user.role !== 'CLIENT' || !user.tenantId || !user.clientId) {
      return NextResponse.json({ error: 'AccÃ¨s rÃ©servÃ© aux clients' }, { status: 403 });
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
      { error: 'Erreur lors de la rÃ©cupÃ©ration des documents' },
      { status: 500 }
    );
  }
}

