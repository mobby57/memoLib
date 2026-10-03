import { NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { requireApiPermission, resolveGroupsFromRole, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { exportIntakeVault } from '@/lib/services/intake-export.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intake/export
 *
 * Génère et renvoie le "coffre-fort" chiffré (.xlsx.enc) des demandes d'intake
 * du tenant. Le fichier est chiffré (AES-256-GCM) : il faut la clé maître pour
 * le déchiffrer. Réservé aux profils gérant les dossiers (dossiers:manage).
 */
function toSession(user: { role: string; groups?: string[] } | null) {
  if (!user) return null;
  const groups = user.groups && user.groups.length > 0 ? user.groups : resolveGroupsFromRole(user.role);
  return { user: { role: user.role, groups } };
}

export async function GET() {
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.DOSSIERS_MANAGE);
  if (!check.ok) return check.response;
  if (!user?.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  const { encrypted, filename, count } = await exportIntakeVault(user.tenantId, {
    actorUserId: user.id,
  });

  return new NextResponse(new Uint8Array(encrypted), {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Intake-Count': String(count),
      'Cache-Control': 'no-store',
    },
  });
}
