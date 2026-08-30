/**
 * API Route: Synchroniser un dossier avec GitHub
 * POST /api/github/sync-dossier
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncDossierToGitHub } from '@/lib/github/user-actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const tenantId = (session.user as any).tenantId;

    const { dossierId, repo } = await req.json();

    if (!dossierId || !repo) {
      return NextResponse.json(
        { error: 'Missing required fields: dossierId, repo' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Dossier not found' },
        { status: 404 }
      );
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

    logger.info('Dossier synchronized to GitHub', {
      dossierId,
      issueNumber: issue.number,
      repo,
      userId,
    });

    return NextResponse.json({
      success: true,
      dossier: {
        id: dossier.id,
        numero: dossier.numero,
      },
      github: {
        issueNumber: issue.number,
        issueUrl: issue.url,
        repo,
      },
    });
  } catch (error) {
    logger.error('Dossier GitHub sync API error', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to sync dossier',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
