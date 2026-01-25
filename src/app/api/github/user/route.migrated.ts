import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/withAuth';
import { getGitHubUserInfo, isGitHubAuthorized } from '@/lib/github/user-client';
import { logger } from '@/lib/logger';

async function handler(request: NextRequest, context: any) {
  const { userId } = context;

  try {
    const isAuthorized = await isGitHubAuthorized();

    if (!isAuthorized) {
      logger.info('GitHub non autorise', { userId });
      return NextResponse.json({
        connected: false,
        message: 'GitHub non connecte',
      });
    }

    const userInfo = await getGitHubUserInfo();

    logger.info('Infos utilisateur GitHub recuperees', {
      userId,
      githubLogin: userInfo.login,
    });

    return NextResponse.json({
      connected: true,
      user: userInfo,
    });
  } catch (error) {
    logger.error('Erreur recuperation infos GitHub', error, { userId });

    return NextResponse.json(
      {
        error: 'Erreur lors de la recuperation des informations GitHub',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ['CLIENT', 'ADMIN', 'SUPER_ADMIN']);
