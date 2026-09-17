import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

const createTeamSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

/**
 * GET /api/teams — Liste les équipes du cabinet (avec nombre de membres).
 * Accessible à tout utilisateur authentifié du tenant (lecture simple),
 * la gestion (création/suppression) reste réservée à USERS_MANAGE.
 */
export async function GET() {
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
    const teams = await prisma.team.findMany({
      where: { tenantId },
      include: {
        _count: { select: { TeamMember: true, Dossier: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    logger.error('Erreur GET teams', error instanceof Error ? error : undefined, { route: '/api/teams' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/teams — Crée une nouvelle équipe dans le cabinet.
 * Réservé aux utilisateurs disposant de la permission RBAC users:manage
 * (cabinet-admin / associate), cohérent avec /api/admin/team.
 */
export async function POST(request: NextRequest) {
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

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const team = await prisma.team.create({
      data: {
        tenantId,
        name: parsed.data.name,
        description: parsed.data.description,
      },
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as any).code : null;
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Une équipe avec ce nom existe déjà' }, { status: 409 });
    }
    logger.error('Erreur POST team', error instanceof Error ? error : undefined, { route: '/api/teams' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




