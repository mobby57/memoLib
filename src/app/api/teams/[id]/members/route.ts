import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const TEAM_MEMBER_ROLES = ['TEAM_LEAD', 'ATTORNEY', 'COLLABORATOR', 'ASSISTANT', 'PARALEGAL', 'MEMBER'] as const;

const addTeamMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(TEAM_MEMBER_ROLES).optional(),
});

const removeTeamMemberSchema = z.object({
  userId: z.string().min(1),
});

/**
 * POST /api/teams/[id]/members — Ajoute un utilisateur du cabinet à l'équipe.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = await params;
  const { user } = await auth();
    const session = user ? { user } : null;
  const check = requireApiPermission(session as any, RBAC_PERMISSIONS.USERS_MANAGE);
  if (!check.ok) {
    return check.response;
  }

  const tenantId = (session!.user as any).tenantId as string | undefined;
  if (!tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const team = await prisma.team.findFirst({ where: { id: teamId, tenantId } });
  if (!team) {
    return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = addTeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: parsed.data.userId, tenantId },
    select: { id: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable dans ce cabinet' }, { status: 404 });
  }

  try {
    const member = await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId: parsed.data.userId } },
      create: {
        tenantId,
        teamId,
        userId: parsed.data.userId,
        role: parsed.data.role || 'MEMBER',
      },
      update: {
        role: parsed.data.role || 'MEMBER',
      },
    });

    logger.info('Membre ajouté à l\'équipe', { teamId, targetUserId: parsed.data.userId });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    logger.error('Erreur POST team member', error instanceof Error ? error : undefined, {
      route: '/api/teams/[id]/members',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/teams/[id]/members?userId=xxx — Retire un membre de l'équipe.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = await params;
  const { user } = await auth();
    const session = user ? { user } : null;
  const check = requireApiPermission(session as any, RBAC_PERMISSIONS.USERS_MANAGE);
  if (!check.ok) {
    return check.response;
  }

  const tenantId = (session!.user as any).tenantId as string | undefined;
  if (!tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const team = await prisma.team.findFirst({ where: { id: teamId, tenantId } });
  if (!team) {
    return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = removeTeamMemberSchema.safeParse({ userId: searchParams.get('userId') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 });
  }

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: parsed.data.userId } },
  });
  if (!existing || existing.tenantId !== tenantId) {
    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
  }

  try {
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: parsed.data.userId } },
    });

    logger.info('Membre retiré de l\'équipe', { teamId, targetUserId: parsed.data.userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur DELETE team member', error instanceof Error ? error : undefined, {
      route: '/api/teams/[id]/members',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
