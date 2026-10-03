import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { requireApiPermission, resolveGroupsFromRole, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { getIntakeUploadedFile, deleteIntakeUploadedFile } from '@/lib/services/intake.service';
import { createAuditLog } from '@/lib/security/audit-trail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/intake/[id]/documents/[fileId]
 *
 * Télécharge une pièce déposée, DÉCHIFFRÉE à la volée. Réservé aux profils
 * gérant/consultant les dossiers (dossiers:read), scope tenant. Chaque
 * téléchargement d'une donnée sensible est audité (RGPD).
 */
function toSession(user: { role: string; groups?: string[] } | null) {
  if (!user) return null;
  const groups = user.groups && user.groups.length > 0 ? user.groups : resolveGroupsFromRole(user.role);
  return { user: { role: user.role, groups } };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id, fileId } = await ctx.params;
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.DOSSIERS_READ);
  if (!check.ok) return check.response;
  if (!user?.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  let result;
  try {
    result = await getIntakeUploadedFile(user.tenantId, id, fileId);
  } catch (e) {
    if (e instanceof Error && e.message === 'Integrity check failed for uploaded file') {
      return NextResponse.json({ error: 'Fichier corrompu (intégrité)' }, { status: 422 });
    }
    throw e;
  }

  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await createAuditLog({
    userId: user.id,
    tenantId: user.tenantId,
    action: 'DOWNLOAD',
    resource: 'DOCUMENT',
    resourceId: fileId,
    description: `Téléchargement d'une pièce d'intake (${result.meta.fileName})`,
    metadata: { intakeId: id },
    success: true,
    sensitiveData: true,
  });

  const safeName = result.meta.fileName.replace(/"/g, '');
  return new NextResponse(new Uint8Array(result.content), {
    status: 200,
    headers: {
      'Content-Type': result.meta.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * DELETE /api/intake/[id]/documents/[fileId]
 * Supprime une pièce déposée (dossiers:manage), scope tenant, audité.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id, fileId } = await ctx.params;
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.DOSSIERS_MANAGE);
  if (!check.ok) return check.response;
  if (!user?.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const { deleted, completeness } = await deleteIntakeUploadedFile(
      user.tenantId,
      id,
      fileId,
      user.id
    );
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, completeness });
  } catch (e) {
    if (e instanceof Error && e.message === 'Intake request not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw e;
  }
}
