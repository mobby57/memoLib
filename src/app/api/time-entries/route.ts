import { auth } from '@/lib/clerk-auth';
/**
 * API Route: /api/time-entries
 * 
 * CRUD complet pour le suivi du temps (time tracking).
 * GET: liste les entrées (filtrage par dossier, date, user)
 * POST: créer une entrée de temps
 * PATCH: modifier une entrée
 * DELETE: supprimer une entrée
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTimeEntrySchema = z.object({
  dossierId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description requise').max(500),
  date: z.string().optional(), // ISO date
  startTime: z.string().optional(), // ISO datetime
  endTime: z.string().optional(),
  duration: z.number().min(1, 'Durée minimum 1 minute'), // en minutes
  tarifHoraire: z.number().min(0).optional(),
  isBillable: z.boolean().optional(),
  category: z.enum(['travail', 'audience', 'rdv', 'deplacement', 'recherche', 'admin', 'telephone', 'correspondance']).optional(),
});

const patchTimeEntrySchema = createTimeEntrySchema.partial().extend({
  id: z.string().uuid(),
  isBilled: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const dossierId = searchParams.get('dossierId');
  const clientId = searchParams.get('clientId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const billableOnly = searchParams.get('billable') === 'true';
  const unbilledOnly = searchParams.get('unbilled') === 'true';

  const where: any = { tenantId };
  if (dossierId) where.dossierId = dossierId;
  if (clientId) where.clientId = clientId;
  if (billableOnly) where.isBillable = true;
  if (unbilledOnly) { where.isBillable = true; where.isBilled = false; }
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      Dossier: { select: { numero: true, objet: true } },
      Client: { select: { firstName: true, lastName: true } },
      User: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: 200,
  });

  // Calculs agrégés
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalBillable = entries.filter(e => e.isBillable).reduce((sum, e) => sum + e.duration, 0);
  const totalMontant = entries.reduce((sum, e) => sum + (e.montant || 0), 0);
  const unbilledMontant = entries.filter(e => e.isBillable && !e.isBilled).reduce((sum, e) => sum + (e.montant || 0), 0);

  return NextResponse.json({
    entries,
    stats: {
      totalEntries: entries.length,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 6) / 10, // 1 decimal
      totalBillableMinutes: totalBillable,
      totalBillableHours: Math.round(totalBillable / 6) / 10,
      totalMontant: Math.round(totalMontant * 100) / 100,
      unbilledMontant: Math.round(unbilledMontant * 100) / 100,
    },
  });
}

export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = createTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const data = parsed.data;
  const montant = data.tarifHoraire ? (data.duration / 60) * data.tarifHoraire : undefined;

  const entry = await prisma.timeEntry.create({
    data: {
      tenantId,
      userId: user.id,
      dossierId: data.dossierId || undefined,
      clientId: data.clientId || undefined,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      duration: data.duration,
      tarifHoraire: data.tarifHoraire || undefined,
      montant,
      isBillable: data.isBillable ?? true,
      category: data.category || 'travail',
    },
  });

  return NextResponse.json({ success: true, entry }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = patchTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const { id, ...updateData } = parsed.data;

  // Vérifier ownership
  const existing = await prisma.timeEntry.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 });

  // Recalculer le montant si durée ou tarif changent
  const duration = updateData.duration || existing.duration;
  const tarif = updateData.tarifHoraire ?? existing.tarifHoraire;
  const montant = tarif ? (duration / 60) * tarif : existing.montant;

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: {
      ...updateData,
      ...(updateData.date ? { date: new Date(updateData.date) } : {}),
      ...(updateData.startTime ? { startTime: new Date(updateData.startTime) } : {}),
      ...(updateData.endTime ? { endTime: new Date(updateData.endTime) } : {}),
      montant,
    },
  });

  return NextResponse.json({ success: true, entry: updated });
}

export async function DELETE(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const existing = await prisma.timeEntry.findFirst({ where: { id, tenantId } });
  if (!existing) return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 });
  if (existing.isBilled) {
    return NextResponse.json({ error: 'Impossible de supprimer une entrée déjà facturée' }, { status: 400 });
  }

  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}




