/**
 * POST /api/comments - Créer un commentaire
 * Phase 5: Collaboration
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CollaborationService } from '@/lib/services/collaboration.service';

const prisma = new PrismaClient();
const collaborationService = new CollaborationService(prisma);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, entityType, entityId, authorId, tenantId } = body;

    // Validation
    if (!content || !entityType || !entityId || !authorId || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['email', 'dossier', 'client', 'document'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entityType' },
        { status: 400 }
      );
    }

    // Créer commentaire avec mentions automatiques
    const comment = await collaborationService.createComment({
      content,
      entityType,
      entityId,
      authorId,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      comment,
      mentionsCount: comment?.mentions?.length || 0,
    });
  } catch (error: any) {
    console.error('[API] POST /api/comments error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/comments?entityType=email&entityId=xxx - Liste commentaires
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing entityType or entityId' },
        { status: 400 }
      );
    }

    const result = await collaborationService.getComments(
      entityType,
      entityId,
      { limit, offset }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] GET /api/comments error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments?id=xxx - Supprimer commentaire
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('id');
    const tenantId = searchParams.get('tenantId');
    const userId = searchParams.get('userId');

    if (!commentId || !tenantId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = await collaborationService.deleteComment(
      commentId,
      tenantId,
      userId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] DELETE /api/comments error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
