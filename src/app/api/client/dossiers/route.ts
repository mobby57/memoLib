import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { user } = await auth();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = user.id;
    const userRole = user.role;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    const body = await request.json();
    const {
      typeDossier,
      objet,
      description,
      priorite,
      dateEcheance,
      articleCeseda,
    } = body;

    if (!typeDossier || !objet) {
      return NextResponse.json(
        { error: 'Type de dossier et objet requis' },
        { status: 400 }
      );
    }

    // Recuperer le client et son tenant
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, clientId: true },
    });

    if (!dbUser?.tenantId || !dbUser.clientId) {
      return NextResponse.json(
        { error: 'Client non associe correctement' },
        { status: 400 }
      );
    }

    // Generer un numero de dossier
    const year = new Date().getFullYear();
    const count = await prisma.dossier.count({
      where: { tenantId: dbUser.tenantId },
    });
    const numero = `D-${year}-${String(count + 1).padStart(4, '0')}`;

    // Creer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        numero,
        typeDossier,
        objet,
        description: description || undefined,
        priorite: priorite || 'normale',
        statut: 'en_cours',
        dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
        articleCeseda: articleCeseda || undefined,
        tenantId: dbUser.tenantId,
        clientId: dbUser.clientId,
      },
    });

    logger.info(`Client ${userId} a cree le dossier ${dossier.numero}`);

    return NextResponse.json({
      success: true,
      dossier: {
        id: dossier.id,
        numero: dossier.numero,
      },
    });
  } catch (error) {
    logger.error('Erreur creation dossier client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de la creation' },
      { status: 500 }
    );
  }
}
