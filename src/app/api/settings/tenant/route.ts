import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/lib/clerk-auth';
import { requireApiPermission, resolveGroupsFromRole, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { getTenantSettings, updateTenantSettings } from '@/lib/services/settings.service';
import { tenantSettingsUpdateSchema } from '@/lib/validation/settings.schema';

export const dynamic = 'force-dynamic';

/**
 * API de configuration cabinet.
 *
 * Chaîne : UI → Hook → Service → API (ici) → Authorization (RBAC) → Prisma → DB.
 *
 * - GET   : lit la config cabinet du tenant courant (settings:read).
 * - PATCH : met à jour partiellement la config (settings:write).
 *
 * Isolation tenant : le tenantId provient TOUJOURS de la session serveur,
 * jamais du corps de la requête (empêche l'écriture cross-tenant).
 */

/**
 * Construit un objet compatible `requireApiPermission` à partir du contexte
 * d'auth (qui ne fournit pas directement `groups`).
 */
function toSession(user: { role: string; groups?: string[] } | null) {
  if (!user) return null;
  const groups = user.groups && user.groups.length > 0 ? user.groups : resolveGroupsFromRole(user.role);
  return { user: { role: user.role, groups } };
}

export async function GET() {
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.SETTINGS_READ);
  if (!check.ok) return check.response;

  if (!user?.tenantId) {
    return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
  }

  const settings = await getTenantSettings(user.tenantId);
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const { user } = await auth();
  const check = requireApiPermission(toSession(user), RBAC_PERMISSIONS.SETTINGS_WRITE);
  if (!check.ok) return check.response;

  if (!user?.tenantId) {
    return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let patch;
  try {
    patch = tenantSettingsUpdateSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten() },
        { status: 400 }
      );
    }
    throw error;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const settings = await updateTenantSettings(user.tenantId, user.id, patch);
  return NextResponse.json(settings);
}
