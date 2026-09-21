import { NextResponse } from 'next/server';
import type { AuthenticatedUser } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';

type WorkspaceAccess =
  | { ok: true; workspace: { id: string; tenantId: string } }
  | { ok: false; response: NextResponse };

export async function authorizeWorkspaceAccess(
  workspaceId: string,
  user: AuthenticatedUser
): Promise<WorkspaceAccess> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, tenantId: true },
  });

  if (!workspace) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 }),
    };
  }

  if (user.role !== 'SUPER_ADMIN' && (!user.tenantId || workspace.tenantId !== user.tenantId)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }),
    };
  }

  return { ok: true, workspace };
}
