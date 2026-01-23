import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { createIssueAsUser } from '@/lib/github/user-actions';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CreateIssueSchema = z.object({
  repo: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

async function handler(request: NextRequest, context: any) {
  const { userId } = context;

  try {
    const body = await request.json();
    const validated = CreateIssueSchema.parse(body);

    const { repo, title, body: issueBody, labels, assignees } = validated;

    // Créer l'issue pour le compte de l'utilisateur
    const issue = await createIssueAsUser(repo, title, issueBody, labels, assignees);

    logger.info('GitHub issue créée via API', {
      userId,
      issueNumber: issue.number,
      repo,
      title,
    });

    return NextResponse.json({
      success: true,
      issue,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Paramètres invalides', details: error.errors }, { status: 400 });
    }

    logger.error('Erreur création issue GitHub', error, { userId });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not connected to GitHub')) {
      return NextResponse.json(
        {
          error: 'GitHub non connecté',
          message: 'Autorisez GitHub dans vos paramètres',
          code: 'GITHUB_NOT_CONNECTED',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: 'Erreur lors de la création issue' }, { status: 500 });
  }
}

export const POST = withAuth(handler, ['ADMIN', 'SUPER_ADMIN']);
