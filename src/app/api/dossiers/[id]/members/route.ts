import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { canAccessDossier } from '@/lib/auth/dossier-access';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const DOSSIER_MEMBER_ROLES = ['OWNER', 'RESPONSIBLE', 'ATTORNEY', 'COLLABORATOR', 'VIEWER'] as const;

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(DOSSIER_MEMBER_ROLES).optional(),
});

const updateMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(DOSSIER_MEMBER_ROLES),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

function getSessionContext(session: {
  user?: {
    id: string;
    tenantId?: string;
    role: string;
    groups?: string[];
  };
} | null) {
  return {
    userId: session?.user?.id,
    tenantId: session?.user?.tenantId,
    role: session?.user?.role,
    groups: session?.user?.groups,
  };
}

/**
 * GET /api/dossiers/[id]/members
 * Liste les membres explicitement assignés à ce dossier (DossierMember).
 * Nécessite au minimum un accès en lecture au dossier.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { userId, tenantId, role, groups } = getSessionContext(session);
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const access = await canAccessDossier({ userId, tenantId, role, groups, dossierId, action: 'read' });
    if (!access.allowed) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }

    const members = await prisma.dossierMember.findMany({
      where: { dossierId, tenantId },
      include: {
        User: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    logger.error('Erreur GET dossier members', error instanceof Error ? error : undefined, {
      route: '/api/dossiers/[id]/members',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/dossiers/[id]/members
 * Ajoute un membre au dossier. Réservé à ceux qui peuvent "manage" ce dossier
 * (admin RBAC global, responsable, ou DossierMember OWNER/RESPONSIBLE).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { userId, tenantId, role, groups } = getSessionContext(session);
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const access = await canAccessDossier({ userId, tenantId, role, groups, dossierId, action: 'manage' });
    if (!access.allowed) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur cible appartient bien au même tenant.
    const targetUser = await prisma.user.findFirst({
      where: { id: parsed.data.userId, tenantId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable dans ce cabinet' }, { status: 404 });
    }

    const member = await prisma.dossierMember.upsert({
      where: { dossierId_userId: { dossierId, userId: parsed.data.userId } },
      create: {
        tenantId,
        dossierId,
        userId: parsed.data.userId,
        role: parsed.data.role || 'COLLABORATOR',
      },
      update: {
        role: parsed.data.role || 'COLLABORATOR',
      },
    });

    logger.info('Membre ajouté au dossier', { dossierId, targetUserId: parsed.data.userId, addedBy: userId });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    logger.error('Erreur POST dossier member', error instanceof Error ? error : undefined, {
      route: '/api/dossiers/[id]/members',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/dossiers/[id]/members
 * Change le rôle d'un membre existant sur ce dossier.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { userId, tenantId, role, groups } = getSessionContext(session);
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const access = await canAccessDossier({ userId, tenantId, role, groups, dossierId, action: 'manage' });
    if (!access.allowed) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.dossierMember.findUnique({
      where: { dossierId_userId: { dossierId, userId: parsed.data.userId } },
    });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    const member = await prisma.dossierMember.update({
      where: { dossierId_userId: { dossierId, userId: parsed.data.userId } },
      data: { role: parsed.data.role },
    });

    logger.info('Rôle de membre dossier modifié', {
      dossierId,
      targetUserId: parsed.data.userId,
      newRole: parsed.data.role,
      changedBy: userId,
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    logger.error('Erreur PATCH dossier member', error instanceof Error ? error : undefined, {
      route: '/api/dossiers/[id]/members',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/dossiers/[id]/members?userId=xxx
 * Retire un membre du dossier.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params;
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { userId, tenantId, role, groups } = getSessionContext(session);
    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const access = await canAccessDossier({ userId, tenantId, role, groups, dossierId, action: 'manage' });
    if (!access.allowed) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = removeMemberSchema.safeParse({ userId: searchParams.get('userId') });
    if (!parsed.success) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const existing = await prisma.dossierMember.findUnique({
      where: { dossierId_userId: { dossierId, userId: parsed.data.userId } },
    });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    await prisma.dossierMember.delete({
      where: { dossierId_userId: { dossierId, userId: parsed.data.userId } },
    });

    logger.info('Membre retiré du dossier', { dossierId, targetUserId: parsed.data.userId, removedBy: userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur DELETE dossier member', error instanceof Error ? error : undefined, {
      route: '/api/dossiers/[id]/members',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
