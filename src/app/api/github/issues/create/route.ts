/**
 * API Route: Créer une issue GitHub pour le compte de l'utilisateur
 * POST /api/github/issues/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createIssueAsUser } from '@/lib/github/user-actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { repo, title, body, labels, assignees } = await req.json();

    // Validation
    if (!repo || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: repo, title' },
        { status: 400 }
      );
    }

    // Créer l'issue pour le compte de l'utilisateur
    const issue = await createIssueAsUser(repo, title, body, labels, assignees);

    logger.info('GitHub issue created via API', {
      userId: (session.user as any).id,
      issueNumber: issue.number,
      repo,
    });

    return NextResponse.json({
      success: true,
      issue,
    });
  } catch (error) {
    logger.error('GitHub issue creation API error', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('not connected to GitHub')) {
      return NextResponse.json(
        {
          error: 'GitHub not connected',
          message: 'Please authorize GitHub in your account settings',
          code: 'GITHUB_NOT_CONNECTED',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create issue',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
