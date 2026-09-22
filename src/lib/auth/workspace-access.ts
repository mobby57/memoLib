import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface AuthedUserLike {
  id?: string;
  tenantId?: string | null;
  role?: string;
  email?: string;
  name?: string;
}

/**
 * Vérifie qu'un workspace appartient à un tenant (par IDs).
 */
export async function assertWorkspaceAccess(
  workspaceId: string,
  tenantId: string
): Promise<boolean> {
  const ws = await prisma.workspace.findFirst({
    where: { id: workspaceId, tenantId },
    select: { id: true },
  });
  return ws !== null;
}

/**
 * Signature "route" : authorizeWorkspaceAccess(workspaceId, user)
 * Supporte aussi (workspaceId, tenantId) pour la compat avec nos patches.
 * Retourne { ok, response, workspace } comme attendu par les routes existantes.
 */
export async function authorizeWorkspaceAccess(
  workspaceId: string,
  userOrTenant: AuthedUserLike | string
): Promise<
  | { ok: true; allowed: true; reason: string; workspace: any }
  | { ok: false; allowed: false; reason: string; response: NextResponse }
> {
  const tenantId =
    typeof userOrTenant === 'string'
      ? userOrTenant
      : (userOrTenant?.tenantId ?? undefined);

  if (!tenantId) {
    return {
      ok: false,
      allowed: false,
      reason: 'no_tenant',
      response: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }),
    };
  }

  const ws = await prisma.workspace.findFirst({
    where: { id: workspaceId, tenantId },
  });

  if (!ws) {
    return {
      ok: false,
      allowed: false,
      reason: 'workspace_not_found_or_other_tenant',
      response: NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 }),
    };
  }

  return {
    ok: true,
    allowed: true,
    reason: 'tenant_match',
    workspace: ws,
  };
}

export async function authorizeWorkspaceAccessFromSession(params: {
  workspaceId: string;
  tenantId: string;
}): Promise<{ allowed: boolean; reason: string }> {
  const ok = await assertWorkspaceAccess(params.workspaceId, params.tenantId);
  return ok
    ? { allowed: true, reason: 'tenant_match' }
    : { allowed: false, reason: 'workspace_not_found_or_other_tenant' };
}
