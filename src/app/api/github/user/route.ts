import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route: Obtenir les informations du compte GitHub de l'utilisateur
 * GET /api/github/user
 */

import { getGitHubUserInfo, isGitHubAuthorized } from '@/lib/github/user-client';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized = await isGitHubAuthorized();

    if (!isAuthorized) {
      return NextResponse.json({
        connected: false,
        message: 'GitHub not connected',
      });
    }

    const userInfo = await getGitHubUserInfo();

    return NextResponse.json({
      connected: true,
      user: userInfo,
    });
  } catch (error) {
    logger.error('GitHub user info API error', error instanceof Error ? error : undefined, {
      route: '/api/github/user',
    });

    return NextResponse.json(
      {
        error: 'Failed to get GitHub user info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


