import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { syncDossierToGitHub } from '@/lib/github/user-actions';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SyncDossierSchema = z.object({
  dossierId: z.string().uuid(),
  repo: z.string().min(1),
});

async function handler(request: NextRequest, context: any) {
  const { userId, tenantId } = context;

  try {
    const body = await request.json();
    const validated = SyncDossierSchema.parse(body);

    const { dossierId, repo } = validated;

    // Recuperer le dossier
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: dossierId,
        tenantId,
      },
      include: {
        client: true,
      },
    });

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
    }

    // Synchroniser avec GitHub
    const issue = await syncDossierToGitHub(
      repo,
      {
        numero: dossier.numero,
        client: `${dossier.client.firstName} ${dossier.client.lastName}`,
        typeDossier: dossier.typeDossier,
        statut: dossier.statut,
        priorite: dossier.priorite,
        description: dossier.description || undefined,
      },
      tenantId,
      userId
    );

    // Sauvegarder le numero d'issue dans le dossier
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        metadata: JSON.stringify({
          githubIssue: issue.number,
          githubUrl: issue.url,
          githubRepo: repo,
        }),
      },
    });

    logger.info('Dossier synchronise avec GitHub', {
      userId,
      tenantId,
      dossierId,
      dossierNumero: dossier.numero,
      issueNumber: issue.number,
      repo,
    });

    return NextResponse.json({
      success: true,
      issue: {
        number: issue.number,
        url: issue.url,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parametres invalides', details: error.errors }, { status: 400 });
    }

    logger.error('Erreur sync GitHub dossier', error, { userId, tenantId });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('not connected to GitHub')) {
      return NextResponse.json(
        { error: 'GitHub non connecte', message: 'Autorisez GitHub dans vos parametres' },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}

export const POST = withAuth(handler, ['ADMIN', 'SUPER_ADMIN']);
