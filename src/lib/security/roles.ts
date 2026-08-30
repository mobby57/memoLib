/**
 * RBAC centralisé memoLib.
 *
 * UserRole = rôle global d'un utilisateur dans le cabinet.
 *
 * ATTENTION :
 * - TeamMemberRole = rôle dans une équipe
 * - DossierMemberRole = rôle dans un dossier
 * Ces deux concepts restent indépendants.
 */

export const USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'ASSOCIE',
  'AVOCAT',
  'COLLABORATEUR',
  'STAGIAIRE',
  'SECRETAIRE',
  'COMPTABLE',
  'CLIENT',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

const ROLE_ALIASES: Record<string, UserRole> = {
  SUPER_ADMIN: 'SUPER_ADMIN',

  ADMIN: 'ADMIN',
  admin: 'ADMIN',

  ASSOCIE: 'ASSOCIE',

  AVOCAT: 'AVOCAT',
  LAWYER: 'AVOCAT',

  COLLABORATEUR: 'COLLABORATEUR',
  STAGIAIRE: 'STAGIAIRE',
  SECRETAIRE: 'SECRETAIRE',
  COMPTABLE: 'COMPTABLE',

  CLIENT: 'CLIENT',
};

/**
 * Normalise un rôle provenant de NextAuth, DB ou données historiques.
 *
 * Retourne null si le rôle est inconnu.
 */
export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') {
    return null;
  }

  const value = role.trim();

  if (!value) {
    return null;
  }

  return ROLE_ALIASES[value] ?? ROLE_ALIASES[value.toUpperCase()] ?? null;
}

export function isValidRole(role: unknown): role is UserRole {
  return normalizeRole(role) !== null;
}

export function isSuperAdmin(role: unknown): boolean {
  return normalizeRole(role) === 'SUPER_ADMIN';
}

export function isAdmin(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
}

export function isStaff(role: unknown): boolean {
  return normalizeRole(role) !== 'CLIENT' && normalizeRole(role) !== null;
}

export function isClient(role: unknown): boolean {
  return normalizeRole(role) === 'CLIENT';
}

/**
 * Permissions applicatives.
 *
 * Le rôle SUPER_ADMIN possède toutes les permissions.
 */
export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',

  CLIENTS_READ: 'clients:read',
  CLIENTS_WRITE: 'clients:write',

  DOSSIERS_READ: 'dossiers:read',
  DOSSIERS_WRITE: 'dossiers:write',
  DOSSIERS_DELETE: 'dossiers:delete',

  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_WRITE: 'documents:write',

  FACTURES_READ: 'factures:read',
  FACTURES_WRITE: 'factures:write',

  ANALYTICS_READ: 'analytics:read',

  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',

  SUPER_ADMIN_READ: 'super_admin:read',

  CLIENT_PORTAL_READ: 'client_portal:read',
  CLIENT_PORTAL_WRITE: 'client_portal:write',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),

  ADMIN: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.DOSSIERS_READ,
    PERMISSIONS.DOSSIERS_WRITE,
    PERMISSIONS.DOSSIERS_DELETE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.FACTURES_READ,
    PERMISSIONS.FACTURES_WRITE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.ADMIN_WRITE,
  ],

  ASSOCIE: [
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.DOSSIERS_READ,
    PERMISSIONS.DOSSIERS_WRITE,
    PERMISSIONS.DOSSIERS_DELETE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
    PERMISSIONS.FACTURES_READ,
    PERMISSIONS.FACTURES_WRITE,
    PERMISSIONS.ANALYTICS_READ,
  ],

  AVOCAT: [
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.DOSSIERS_READ,
    PERMISSIONS.DOSSIERS_WRITE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
  ],

  COLLABORATEUR: [
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.DOSSIERS_READ,
    PERMISSIONS.DOSSIERS_WRITE,
    PERMISSIONS.DOCUMENTS_READ,
    PERMISSIONS.DOCUMENTS_WRITE,
  ],

  STAGIAIRE: [
    PERMISSIONS.DOSSIERS_READ,
    PERMISSIONS.DOCUMENTS_READ,
  ],

  SECRETAIRE: [
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.DOSSIERS_READ,
    PERMISSIONS.DOCUMENTS_READ,
  ],

  COMPTABLE: [
    PERMISSIONS.FACTURES_READ,
    PERMISSIONS.FACTURES_WRITE,
  ],

  CLIENT: [
    PERMISSIONS.CLIENT_PORTAL_READ,
    PERMISSIONS.CLIENT_PORTAL_WRITE,
    PERMISSIONS.DOCUMENTS_READ,
  ],
};

export function hasPermission(
  role: unknown,
  permission: Permission,
): boolean {
  const normalized = normalizeRole(role);

  if (!normalized) {
    return false;
  }

  return ROLE_PERMISSIONS[normalized].includes(permission);
}

export function requireRole(
  role: unknown,
  allowedRoles: readonly UserRole[],
): boolean {
  const normalized = normalizeRole(role);

  return normalized !== null && allowedRoles.includes(normalized);
}
