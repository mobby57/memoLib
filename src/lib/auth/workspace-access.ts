import { prisma } from '@/lib/prisma';

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

export async function authorizeWorkspaceAccess(
  workspaceId: string,
  tenantId: string
): Promise<{ allowed: boolean; reason: string }> {
  const ok = await assertWorkspaceAccess(workspaceId, tenantId);
  return ok
    ? { allowed: true, reason: 'tenant_match' }
    : { allowed: false, reason: 'workspace_not_found_or_other_tenant' };
}

export async function authorizeWorkspaceAccessFromSession(params: {
  workspaceId: string;
  tenantId: string;
}): Promise<{ allowed: boolean; reason: string }> {
  return authorizeWorkspaceAccess(params.workspaceId, params.tenantId);
}
