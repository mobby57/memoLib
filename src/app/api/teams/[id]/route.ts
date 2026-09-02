import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateTeamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
});

/**
 * GET /api/teams/[id] — Détail d'une équipe avec ses membres.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = await params;
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const tenantId = (user as any).tenantId as string | undefined;
  if (!tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const team = await prisma.team.findFirst({
      where: { id: teamId, tenantId },
      include: {
        TeamMember: {
          include: { User: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { Dossier: true } },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ success: true, team });
  } catch (error) {
    logger.error('Erreur GET team', error instanceof Error ? error : undefined, { route: '/api/teams/[id]' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/teams/[id] — Renomme/décrit une équipe.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.team.findFirst({ where: { id: teamId, tenantId } });
  if (!existing) {
    return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
  }

  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      },
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as any).code : null;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Une équipe avec ce nom existe déjà' }, { status: 409 });
    }
    logger.error('Erreur PATCH team', error instanceof Error ? error : undefined, { route: '/api/teams/[id]' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/teams/[id] — Supprime une équipe.
 * Les dossiers rattachés voient leur teamId passer à null (ON DELETE SET NULL),
 * ils ne sont jamais supprimés.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

  const existing = await prisma.team.findFirst({ where: { id: teamId, tenantId } });
  if (!existing) {
    return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 });
  }

  try {
    await prisma.team.delete({ where: { id: teamId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur DELETE team', error instanceof Error ? error : undefined, { route: '/api/teams/[id]' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
