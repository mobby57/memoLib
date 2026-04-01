import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['AVOCAT', 'ASSOCIE', 'COLLABORATEUR', 'STAGIAIRE', 'SECRETAIRE', 'COMPTABLE'] as const;

/**
 * GET /api/admin/team — Lister les membres de l'équipe du cabinet
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { role, tenantId } = session.user as any;
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { role, tenantId } = session.user as any;
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

  // Mot de passe temporaire — l'utilisateur devra le changer
  const tempPassword = randomUUID().slice(0, 12);
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const member = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      role: memberRole,
      phone: phone || null,
      status: 'active',
      tenantId,
    },
  });

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
    },
    tempPassword,
  });
}

/**
 * PATCH /api/admin/team — Modifier le rôle ou désactiver un membre
 */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { role, tenantId } = session.user as any;
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
