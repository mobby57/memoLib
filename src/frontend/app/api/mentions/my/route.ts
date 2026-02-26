/**
 * GET /api/mentions/my - Récupérer mes mentions
 * Phase 5: Collaboration
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CollaborationService } from '@/lib/services/collaboration.service';

const prisma = new PrismaClient();
const collaborationService = new CollaborationService(prisma);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const result = await collaborationService.getMyMentions(userId, { limit });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] GET /api/mentions/my error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/mentions/my?id=xxx - Marquer mention comme lue
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mentionId = searchParams.get('id');

    if (!mentionId) {
      return NextResponse.json(
        { error: 'Missing mentionId parameter' },
        { status: 400 }
      );
    }

    const mention = await collaborationService.markMentionAsRead(mentionId);

    return NextResponse.json({ success: true, mention });
  } catch (error: any) {
    console.error('[API] PATCH /api/mentions/my error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
