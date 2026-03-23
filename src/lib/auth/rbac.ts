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
  | 'associate'
  | 'billing-manager'
  | 'lawyer'
  | 'intern'
  | 'secretary'
  | 'accountant'
  | 'client';

type SessionLike = {
  user?: {
    role?: string;
    groups?: string[];
    rbacPermissions?: string[];
  };
};

const GROUP_PERMISSIONS: Record<RbacGroup, RbacPermission[]> = {
  'platform-admin': ['*'],

  // Avocat titulaire — tout le cabinet
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

  // Associé — comme cabinet-admin + finances
  associate: [
    RBAC_PERMISSIONS.USERS_READ,
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
  ],

  // Collaborateur — dossiers, clients, docs
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

  // Stagiaire — lecture + tâches assignées
  intern: [
    RBAC_PERMISSIONS.CLIENTS_READ,
    RBAC_PERMISSIONS.TASKS_READ,
    RBAC_PERMISSIONS.TASKS_MANAGE,
    RBAC_PERMISSIONS.EVENTS_READ,
    RBAC_PERMISSIONS.DOSSIERS_READ,
    RBAC_PERMISSIONS.DOCUMENTS_READ,
  ],

  // Secrétaire — agenda, emails, docs, clients
  secretary: [
    RBAC_PERMISSIONS.CLIENTS_READ,
    RBAC_PERMISSIONS.CLIENTS_MANAGE,
    RBAC_PERMISSIONS.TASKS_READ,
    RBAC_PERMISSIONS.TASKS_MANAGE,
    RBAC_PERMISSIONS.EVENTS_READ,
    RBAC_PERMISSIONS.EVENTS_MANAGE,
    RBAC_PERMISSIONS.DOSSIERS_READ,
    RBAC_PERMISSIONS.DOCUMENTS_READ,
    RBAC_PERMISSIONS.DOCUMENTS_MANAGE,
  ],

  // Comptable — factures, paiements, analytics
  accountant: [
    RBAC_PERMISSIONS.FACTURES_READ,
    RBAC_PERMISSIONS.FACTURES_MANAGE,
    RBAC_PERMISSIONS.PAYMENTS_CREATE_INTENT,
    RBAC_PERMISSIONS.ANALYTICS_READ,
    RBAC_PERMISSIONS.CLIENTS_READ,
  ],

  'billing-manager': [
    RBAC_PERMISSIONS.FACTURES_READ,
    RBAC_PERMISSIONS.FACTURES_MANAGE,
    RBAC_PERMISSIONS.PAYMENTS_CREATE_INTENT,
    RBAC_PERMISSIONS.ANALYTICS_READ,
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
  AVOCAT: ['cabinet-admin', 'billing-manager'],
  ASSOCIE: ['associate', 'billing-manager'],
  COLLABORATEUR: ['lawyer'],
  LAWYER: ['lawyer'],
  STAGIAIRE: ['intern'],
  SECRETAIRE: ['secretary'],
  COMPTABLE: ['accountant'],
  CLIENT: ['client'],
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeRole(role?: string): string {
  return (role || '').trim().toUpperCase();
}

export function resolveGroupsFromRole(role?: string): RbacGroup[] {
  const normalized = normalizeRole(role);
  return ROLE_GROUPS[normalized] || ['client'];
}

export function resolvePermissionsFromGroups(groups: readonly string[]): RbacPermission[] {
  const allPermissions: RbacPermission[] = [];
  for (const group of groups) {
    const groupKey = group as RbacGroup;
    const groupPermissions = GROUP_PERMISSIONS[groupKey] || [];
    allPermissions.push(...groupPermissions);
  }
  return unique(allPermissions);
}

export function buildRbacContext(params: { role?: string; groups?: readonly string[] }) {
  const roleGroups = resolveGroupsFromRole(params.role);
  const explicitGroups = (params.groups || []).filter((group): group is string => Boolean(group));
  const groups = unique([...roleGroups, ...explicitGroups]);
  const permissions = resolvePermissionsFromGroups(groups);

  return {
    role: normalizeRole(params.role),
    groups,
    permissions,
  };
}

export function hasPermission(params: { role?: string; groups?: readonly string[]; required: RbacPermission }): boolean {
  const context = buildRbacContext({ role: params.role, groups: params.groups });
  return context.permissions.includes('*') || context.permissions.includes(params.required);
}

export function requireApiPermission(
  session: SessionLike | null,
  required: RbacPermission
): { ok: true; role: string; groups: string[]; permissions: RbacPermission[] } | { ok: false; response: NextResponse } {
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const context = buildRbacContext({
    role: session.user.role,
    groups: session.user.groups,
  });

  const allowed = context.permissions.includes('*') || context.permissions.includes(required);
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    role: context.role,
    groups: context.groups,
    permissions: context.permissions,
  };
}
