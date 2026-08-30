import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/authOptions';
import { logger } from '@/lib/logger';

const deadlineTypes = [
  'RECOURS_GRACIEUX',
  'RECOURS_HIERARCHIQUE',
  'RECOURS_CONTENTIEUX',
  'APPEL',
  'CASSATION',
  'REPONSE_PREFECTURE',
  'CONVOCATION_AUDIENCE',
  'PRODUCTION_PIECES',
  'EXECUTION_DECISION',
  'OQTF',
  'RETENTION',
  'CUSTOM',
] as const;
const deadlineStatuses = ['PENDING', 'APPROACHING', 'URGENT', 'CRITICAL', 'OVERDUE', 'COMPLETED', 'CANCELLED', 'SUSPENDED'] as const;
const managedRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'AVOCAT', 'LAWYER', 'MANAGER']);

const CreateDeadlineSchema = z.object({
  dossierId: z.string().min(1),
  clientId: z.string().min(1),
  type: z.enum(deadlineTypes),
  label: z.string().trim().min(1).max(255),
  description: z.string().max(10_000).optional(),
  referenceDate: z.coerce.date(),
  legalDays: z.number().int().min(1).max(3_650).optional(),
  legalBasis: z.string().max(1_000).optional(),
});

const UpdateDeadlineSchema = z.object({
  deadlineId: z.string().min(1),
  status: z.enum(deadlineStatuses).optional(),
  completionNote: z.string().max(10_000).optional(),
  proofId: z.string().min(1).optional(),
});

async function resolveAccess(requestedTenantId: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) };

  const user = session.user as { id?: string; tenantId?: string; role?: string };
  const role = user.role?.toUpperCase() ?? '';
  if (!user.id) return { error: NextResponse.json({ error: 'Session invalide' }, { status: 401 }) };

  if (role === 'SUPER_ADMIN' && requestedTenantId) {
    return { tenantId: requestedTenantId, userId: user.id, role };
  }
  if (!user.tenantId) return { error: NextResponse.json({ error: 'Tenant requis' }, { status: 403 }) };
  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    return { error: NextResponse.json({ error: 'Accès interdit' }, { status: 403 }) };
  }
  return { tenantId: user.tenantId, userId: user.id, role };
}

function canManageDeadlines(role: string) {
  return managedRoles.has(role);
}

// GET - Liste des délais légaux du tenant de la session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const access = await resolveAccess(searchParams.get('tenantId'));
    if ('error' in access) return access.error;

    const dossierId = searchParams.get('dossierId');
    const status = searchParams.get('status');
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '50', 10) || 50));
    const offset = Math.max(0, Number.parseInt(searchParams.get('offset') ?? '0', 10) || 0);
    const where: Record<string, unknown> = { tenantId: access.tenantId };
    if (dossierId) where.dossierId = dossierId;
    if (status && deadlineStatuses.includes(status as (typeof deadlineStatuses)[number])) where.status = status;

    const [deadlines, total] = await Promise.all([
      prisma.legalDeadline.findMany({
        where,
        include: {
          dossier: { select: { numero: true, client: { select: { firstName: true, lastName: true } } } },
          alerts: { orderBy: { sentAt: 'desc' }, take: 3 },
        },
        orderBy: { dueDate: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.legalDeadline.count({ where }),
    ]);
    return NextResponse.json({ deadlines, total, hasMore: offset + deadlines.length < total });
  } catch (error) {
    logger.error('Erreur GET legal-deadlines', error instanceof Error ? error : undefined, { route: '/api/legal-deadlines' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un délai légal structuré et rattaché au tenant de la session
export async function POST(request: NextRequest) {
  try {
    const access = await resolveAccess(null);
    if ('error' in access) return access.error;
    if (!canManageDeadlines(access.role)) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

    const parsed = CreateDeadlineSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });

    const dossier = await prisma.dossier.findFirst({
      where: { id: parsed.data.dossierId, tenantId: access.tenantId, clientId: parsed.data.clientId },
      select: { id: true },
    });
    if (!dossier) return NextResponse.json({ error: 'Dossier ou client non trouvé' }, { status: 404 });

    const defaultDays: Partial<Record<(typeof deadlineTypes)[number], number>> = {
      RECOURS_GRACIEUX: 60, RECOURS_HIERARCHIQUE: 60, RECOURS_CONTENTIEUX: 60, APPEL: 30, CASSATION: 60, OQTF: 30,
    };
    const legalDays = parsed.data.legalDays ?? defaultDays[parsed.data.type] ?? 30;
    const dueDate = new Date(parsed.data.referenceDate);
    dueDate.setDate(dueDate.getDate() + legalDays);

    const deadline = await prisma.legalDeadline.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: access.tenantId,
        dossierId: parsed.data.dossierId,
        clientId: parsed.data.clientId,
        type: parsed.data.type,
        label: parsed.data.label,
        description: parsed.data.description,
        referenceDate: parsed.data.referenceDate,
        dueDate,
        legalDays,
        legalBasis: parsed.data.legalBasis,
        createdBy: access.userId,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, deadline }, { status: 201 });
  } catch (error) {
    logger.error('Erreur POST legal-deadline', error instanceof Error ? error : undefined, { route: '/api/legal-deadlines' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour un délai du tenant de la session
export async function PATCH(request: NextRequest) {
  try {
    const access = await resolveAccess(null);
    if ('error' in access) return access.error;
    if (!canManageDeadlines(access.role)) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

    const parsed = UpdateDeadlineSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });

    const existing = await prisma.legalDeadline.findFirst({ where: { id: parsed.data.deadlineId, tenantId: access.tenantId } });
    if (!existing) return NextResponse.json({ error: 'Délai non trouvé' }, { status: 404 });

    const data = {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.status === 'COMPLETED' ? { completedBy: access.userId, completedAt: new Date() } : {}),
      ...(parsed.data.completionNote !== undefined ? { completionNote: parsed.data.completionNote } : {}),
      ...(parsed.data.proofId !== undefined ? { proofId: parsed.data.proofId } : {}),
    };
    const deadline = await prisma.legalDeadline.update({ where: { id: existing.id }, data });
    return NextResponse.json({ success: true, deadline });
  } catch (error) {
    logger.error('Erreur PATCH legal-deadline', error instanceof Error ? error : undefined, { route: '/api/legal-deadlines' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
