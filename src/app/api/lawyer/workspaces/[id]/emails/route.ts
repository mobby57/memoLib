/**
 * API Route - Emails Workspace
 * GET /api/lawyer/workspaces/[id]/emails - Liste emails avec filtres
 * PATCH /api/lawyer/workspaces/[id]/emails - Actions (marquer lu, favoris, archiver)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * PATCH - Actions sur emails
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { emailId, action } = body;

    if (!emailId || !action) {
      return NextResponse.json({ error: 'emailId et action requis' }, { status: 400 });
    }

    const updateData: any = {};

    switch (action) {
      case 'mark_read':
        updateData.isRead = true;
        break;
      case 'mark_unread':
        updateData.isRead = false;
        break;
      case 'star':
        updateData.isStarred = true;
        break;
      case 'unstar':
        updateData.isStarred = false;
        break;
      case 'archive':
        updateData.isArchived = true;
        break;
      case 'unarchive':
        updateData.isArchived = false;
        break;
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const email = await prisma.workspaceEmail.update({
      where: { id: emailId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Action ${action} effectuée`,
      email,
    });
  } catch (error) {
    console.error('Erreur PATCH email:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET - Liste emails avec filtres
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const isRead = searchParams.get('isRead');
    const needsResponse = searchParams.get('needsResponse');
    const search = searchParams.get('search');

    const where: any = {
      workspaceId: params.id,
    };

    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (isRead !== null) where.isRead = isRead === 'true';
    if (needsResponse !== null) where.needsResponse = needsResponse === 'true';
    
    if (search) {
      where.OR = [
        { from: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { bodyText: { contains: search, mode: 'insensitive' } },
      ];
    }

    const emails = await prisma.workspaceEmail.findMany({
      where,
      orderBy: { receivedDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    });

  } catch (error) {
    console.error('Erreur récupération emails:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { emailId, action } = body;

    if (!emailId || !action) {
      return NextResponse.json(
        { error: 'emailId et action requis' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    switch (action) {
      case 'mark_read':
        updateData.isRead = true;
        updateData.readAt = new Date();
        break;
      case 'mark_unread':
        updateData.isRead = false;
        updateData.readAt = null;
        break;
      case 'star':
        updateData.isStarred = true;
        break;
      case 'unstar':
        updateData.isStarred = false;
        break;
      case 'archive':
        updateData.isArchived = true;
        break;
      case 'unarchive':
        updateData.isArchived = false;
        break;
      default:
        return NextResponse.json(
          { error: 'Action invalide' },
          { status: 400 }
        );
    }

    const email = await prisma.workspaceEmail.update({
      where: { id: emailId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      email,
    });

  } catch (error) {
    console.error('Erreur action email:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
