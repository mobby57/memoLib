import { NextResponse } from 'next/server';

export const RBAC_PERMISSIONS = {
  TENANTS_READ: 'tenants:read',
  TENANTS_CREATE: 'tenants:create',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  CLIENTS_READ: 'clients:read',
  CLIENTS_MANAGE: 'clients:manage',
  TASKS_READ: 'tasks:read',
  TASKS_MANAGE: 'tasks:manage',
  EVENTS_READ: 'events:read',
  EVENTS_MANAGE: 'events:manage',
  DOSSIERS_READ: 'dossiers:read',
  DOSSIERS_MANAGE: 'dossiers:manage',
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_MANAGE: 'documents:manage',
  FACTURES_READ: 'factures:read',
  FACTURES_MANAGE: 'factures:manage',
  PAYMENTS_CREATE_INTENT: 'payments:create_intent',
  ANALYTICS_READ: 'analytics:read',
} as const;

export type RbacPermission = (typeof RBAC_PERMISSIONS)[keyof typeof RBAC_PERMISSIONS] | '*';

export type RbacGroup =
  | 'platform-admin'
  | 'cabinet-admin'
  | 'billing-manager'
  | 'lawyer'
  | 'client';

type SessionLike = {
  user?: {
    role?: string;
    groups?: string[];
  };
};

const GROUP_PERMISSIONS: Record<RbacGroup, RbacPermission[]> = {
  'platform-admin': ['*'],
  'cabinet-admin': [
    RBAC_PERMISSIONS.USERS_READ,
    RBAC_PERMISSIONS.USERS_MANAGE,
    RBAC_PERMISSIONS.CLIENTS_READ,
    RBAC_PERMISSIONS.CLIENTS_MANAGE,
    RBAC_PERMISSIONS.TASKS_READ,
    RBAC_PERMISSIONS.TASKS_MANAGE,
    RBAC_PERMISSIONS.EVENTS_READ,
    RBAC_PERMISSIONS.EVENTS_MANAGE,
    RBAC_PERMISSIONS.DOSSIERS_READ,
    RBAC_PERMISSIONS.DOSSIERS_MANAGE,
    RBAC_PERMISSIONS.DOCUMENTS_READ,
    RBAC_PERMISSIONS.DOCUMENTS_MANAGE,
    RBAC_PERMISSIONS.FACTURES_READ,
    RBAC_PERMISSIONS.FACTURES_MANAGE,
    RBAC_PERMISSIONS.PAYMENTS_CREATE_INTENT,
    RBAC_PERMISSIONS.ANALYTICS_READ,
    RBAC_PERMISSIONS.TENANTS_READ,
  ],
  'billing-manager': [
    RBAC_PERMISSIONS.FACTURES_READ,
    RBAC_PERMISSIONS.FACTURES_MANAGE,
    RBAC_PERMISSIONS.PAYMENTS_CREATE_INTENT,
    RBAC_PERMISSIONS.ANALYTICS_READ,
  ],
  lawyer: [
    RBAC_PERMISSIONS.CLIENTS_READ,
    RBAC_PERMISSIONS.CLIENTS_MANAGE,
    RBAC_PERMISSIONS.TASKS_READ,
    RBAC_PERMISSIONS.TASKS_MANAGE,
    RBAC_PERMISSIONS.EVENTS_READ,
    RBAC_PERMISSIONS.EVENTS_MANAGE,
    RBAC_PERMISSIONS.DOSSIERS_READ,
    RBAC_PERMISSIONS.DOSSIERS_MANAGE,
    RBAC_PERMISSIONS.DOCUMENTS_READ,
    RBAC_PERMISSIONS.DOCUMENTS_MANAGE,
    RBAC_PERMISSIONS.FACTURES_READ,
    RBAC_PERMISSIONS.PAYMENTS_CREATE_INTENT,
  ],
  client: [
    RBAC_PERMISSIONS.DOSSIERS_READ,
    RBAC_PERMISSIONS.DOCUMENTS_READ,
    RBAC_PERMISSIONS.FACTURES_READ,
    RBAC_PERMISSIONS.PAYMENTS_CREATE_INTENT,
  ],
};

const ROLE_GROUPS: Record<string, RbacGroup[]> = {
  SUPER_ADMIN: ['platform-admin'],
  ADMIN: ['cabinet-admin', 'billing-manager'],
  LAWYER: ['lawyer'],
  CLIENT: ['client'],
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeRole(role?: string): string {
  return (role || '').trim().toUpperCase();
}

function resolveGroupsFromRole(role?: string): RbacGroup[] {
  const normalized = normalizeRole(role);
  return ROLE_GROUPS[normalized] || ['client'];
}

function resolvePermissionsFromGroups(groups: readonly string[]): RbacPermission[] {
  const allPermissions: RbacPermission[] = [];
  for (const group of groups) {
    const groupKey = group as RbacGroup;
    const groupPermissions = GROUP_PERMISSIONS[groupKey] || [];
    allPermissions.push(...groupPermissions);
  }
  return unique(allPermissions);
}

export function requireApiPermission(
  session: SessionLike | null,
  required: RbacPermission
): { ok: true } | { ok: false; response: NextResponse } {
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const roleGroups = resolveGroupsFromRole(session.user.role);
  const explicitGroups = (session.user.groups || []).filter((group): group is string => Boolean(group));
  const groups = unique([...roleGroups, ...explicitGroups]);
  const permissions = resolvePermissionsFromGroups(groups);

  const allowed = permissions.includes('*') || permissions.includes(required);
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true };
}
