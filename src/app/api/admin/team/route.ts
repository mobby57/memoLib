import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['AVOCAT', 'ASSOCIE', 'COLLABORATEUR', 'STAGIAIRE', 'SECRETAIRE', 'COMPTABLE'] as const;

/**
 * GET /api/admin/team — Lister les membres de l'équipe du cabinet
 */
export async function GET() {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { role, tenantId } = user as any;
  if (!['SUPER_ADMIN', 'AVOCAT', 'ASSOCIE', 'ADMIN'].includes(role) || !tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      status: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ success: true, members });
}

/**
 * POST /api/admin/team — Inviter un nouveau membre dans le cabinet
 */
export async function POST(request: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { role, tenantId } = user as any;
  if (!['SUPER_ADMIN', 'AVOCAT', 'ADMIN'].includes(role) || !tenantId) {
    return NextResponse.json({ error: 'Seul l\'avocat titulaire peut inviter des membres' }, { status: 403 });
  }

  const { email, name, memberRole, phone } = await request.json();

  if (!email || !name || !memberRole) {
    return NextResponse.json({ error: 'Email, nom et rôle requis' }, { status: 400 });
  }

  if (!VALID_ROLES.includes(memberRole)) {
    return NextResponse.json(
      { error: `Rôle invalide. Rôles acceptés: ${VALID_ROLES.join(', ')}` },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 });
  }

  // Vérifier les limites du plan
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (tenant && tenant.currentUsers >= tenant.plan.maxUsers) {
    return NextResponse.json(
      { error: `Limite du plan atteinte (${tenant.plan.maxUsers} utilisateurs max). Passez au plan supérieur.` },
      { status: 403 }
    );
  }

  // 1. Creer le membre en base (sans mot de passe, Clerk gere l'auth)
  const member = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: email.toLowerCase(),
      name,
      password: '', // Gere par Clerk
      role: memberRole,
      phone: phone || null,
      status: 'pending', // En attente de creation de compte Clerk
      tenantId,
    },
  });

  // 2. Envoyer l'invitation Clerk (envoie l'email au collaborateur)
  const { clerkClient } = await import('@clerk/nextjs/server');
  const clerk = await clerkClient();
  
  try {
    await clerk.invitations.createInvitation({
      emailAddress: email.toLowerCase(),
      publicMetadata: {
        tenantId,
        role: memberRole,
        userId: member.id,
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fr/cabinet`,
      ignoreExisting: true,
    });
  } catch (inviteError) {
    // Si l'invitation echoue, on supprime le membre pour ne pas avoir de fantome
    await prisma.user.delete({ where: { id: member.id } });
    throw new Error(`Invitation Clerk echouee : ${inviteError instanceof Error ? inviteError.message : 'inconnue'}`);
  }

  // Incrémenter le compteur
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { currentUsers: { increment: 1 } },
  });

  return NextResponse.json({
    success: true,
    message: `${name} ajouté(e) comme ${memberRole}`,
    member: {
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
    }
  });
}

/**
 * PATCH /api/admin/team — Modifier le rôle ou désactiver un membre
 */
export async function PATCH(request: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { role, tenantId } = user as any;
  if (!['SUPER_ADMIN', 'AVOCAT', 'ADMIN'].includes(role) || !tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { memberId, newRole, status } = await request.json();

  if (!memberId) {
    return NextResponse.json({ error: 'memberId requis' }, { status: 400 });
  }

  const member = await prisma.user.findFirst({
    where: { id: memberId, tenantId },
  });

  if (!member) {
    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
  }

  const updateData: any = {};
  if (newRole && VALID_ROLES.includes(newRole)) updateData.role = newRole;
  if (status && ['active', 'inactive'].includes(status)) updateData.status = status;

  const updated = await prisma.user.update({
    where: { id: memberId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  return NextResponse.json({ success: true, member: updated });
}




