import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { getSecurePrisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['AVOCAT', 'ASSOCIE', 'COLLABORATEUR', 'STAGIAIRE', 'SECRETAIRE', 'COMPTABLE'] as const;
const inviteSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(1).max(200),
  memberRole: z.enum(VALID_ROLES),
  phone: z.string().trim().max(50).optional().nullable(),
});
const patchSchema = z
  .object({
    memberId: z.string().min(1),
    newRole: z.enum(VALID_ROLES).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((value) => value.newRole !== undefined || value.status !== undefined);

/**
 * GET /api/admin/team â€” Lister les membres de l'Ã©quipe du cabinet
 */
export async function GET() {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
  }

  const { role, tenantId } = session.user as any;
  if (!['SUPER_ADMIN', 'AVOCAT', 'ASSOCIE', 'ADMIN'].includes(role) || !tenantId) {
    return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
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
 * POST /api/admin/team â€” Inviter un nouveau membre dans le cabinet
 */
export async function POST(request: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
  }

  const { role, tenantId } = session.user as any;
  if (role !== 'ADMIN' || !tenantId) {
    return NextResponse.json({ error: 'Seul un administrateur peut inviter des membres' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
  }
  const { email, name, memberRole, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe dÃ©jÃ  avec cet email' }, { status: 409 });
  }

  // VÃ©rifier les limites du plan
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (tenant && tenant.currentUsers >= tenant.plan.maxUsers) {
    return NextResponse.json(
      { error: `Limite du plan atteinte (${tenant.plan.maxUsers} utilisateurs max). Passez au plan supÃ©rieur.` },
      { status: 403 }
    );
  }

  // Mot de passe temporaire â€” l'utilisateur devra le changer
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

  // IncrÃ©menter le compteur
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { currentUsers: { increment: 1 } },
  });

  return NextResponse.json({
    success: true,
    message: `${name} ajoutÃ©(e) comme ${memberRole}`,
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
 * PATCH /api/admin/team â€” Modifier le rÃ´le ou dÃ©sactiver un membre
 */
export async function PATCH(request: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
  }

  const { role, tenantId } = session.user as any;
  if (!['SUPER_ADMIN', 'AVOCAT', 'ADMIN'].includes(role) || !tenantId) {
    return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
  }
  const { memberId, newRole, status } = parsed.data;

  if (newRole && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Seul un administrateur peut modifier les roles' }, { status: 403 });
  }

  const member = await prisma.user.findFirst({
    where: { id: memberId, tenantId },
  });

  if (!member) {
    return NextResponse.json({ error: 'Membre non trouvÃ©' }, { status: 404 });
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

