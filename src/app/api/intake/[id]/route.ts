import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/clerk-auth';
import { requireApiPermission, resolveGroupsFromRole, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { getIntakeRequest, updateIntakeResponses, markNeedsHelp } from '@/lib/services/intake.service';

export const dynamic = 'force-dynamic';

/**
 * GET   /api/intake/[id]  → demande d'intake déchiffrée (dossiers:read)
 * PATCH /api/intake/[id]  → met à jour réponses/documents (dossiers:manage)
 *
 * Isolation tenant : la demande n'est lue/écrite que si elle appartient au
 * tenant de la session (le service filtre par tenantId).
 */

function toSession(user: { role: string; groups?: string[] } | null) {
  if (!user) return null;
  const groups = user.groups && user.groups.length > 0 ? user.groups : resolveGroupsFromRole(user.role);
  return { user: { role: user.role, groups } };
}

const updateSchema = z.object({
  data: z.record(z.string(), z.unknown()).default({}),
  providedDocuments: z.array(z.string()).default([]),
  needsHelp: z.boolean().optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.DOSSIERS_READ);
  if (!check.ok) return check.response;
  if (!user?.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  const intake = await getIntakeRequest(user.tenantId, id);
  if (!intake) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(intake);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.DOSSIERS_MANAGE);
  if (!check.ok) return check.response;
  if (!user?.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (parsed.data.needsHelp) {
      await markNeedsHelp(user.tenantId, id, user.id);
    }
    const updated = await updateIntakeResponses(
      user.tenantId,
      id,
      parsed.data.data,
      parsed.data.providedDocuments,
      user.id
    );
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === 'Intake request not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw e;
  }
}
