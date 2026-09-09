import { NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { requireApiPermission, resolveGroupsFromRole, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { listIntakeNeedingHelp } from '@/lib/services/intake.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intake/needs-help
 *
 * Liste les demandes d'intake du tenant qui nécessitent une intervention
 * (PENDING / IN_PROGRESS / NEEDS_HELP). Renvoie uniquement des métadonnées
 * non sensibles (aucun déchiffrement) → sûr pour un widget dashboard.
 *
 * Autorisation : dossiers:read (les collaborateurs qui gèrent les dossiers).
 */
function toSession(user: { role: string; groups?: string[] } | null) {
  if (!user) return null;
  const groups = user.groups && user.groups.length > 0 ? user.groups : resolveGroupsFromRole(user.role);
  return { user: { role: user.role, groups } };
}

export async function GET() {
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.DOSSIERS_READ);
  if (!check.ok) return check.response;

  if (!user?.tenantId) {
    return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
  }

  const items = await listIntakeNeedingHelp(user.tenantId);
  return NextResponse.json({ items, count: items.length });
}
