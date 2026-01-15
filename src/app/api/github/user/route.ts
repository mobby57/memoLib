/**
 * API Route: Obtenir les informations du compte GitHub de l'utilisateur
 * GET /api/github/user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGitHubUserInfo, isGitHubAuthorized } from '@/lib/github/user-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
    console.error('GitHub user info API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get GitHub user info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
