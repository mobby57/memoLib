#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "========================================"
echo " memoLib — RBAC centralisation"
echo "========================================"

echo
echo "== 0. Vérification Git =="

if [[ -n "$(git status --porcelain)" ]]; then
  echo "⚠️  Le working tree contient déjà des modifications."
  git status --short
  echo
  read -r -p "Continuer quand même ? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || exit 1
fi

mkdir -p scripts
mkdir -p src/lib/security

echo
echo "== 1. Backup =="

BACKUP="backup-rbac-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"

cp prisma/schema.prisma "$BACKUP/schema.prisma"

if [[ -f src/lib/security/authorization.ts ]]; then
  cp src/lib/security/authorization.ts "$BACKUP/authorization.ts"
fi

echo "Backup créé : $BACKUP"

echo
echo "== 2. Inventaire des rôles dans le code =="

grep -Rho \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude='*.bak*' \
  -E "'(SUPER_ADMIN|ADMIN|ASSOCIE|AVOCAT|LAWYER|COLLABORATEUR|STAGIAIRE|SECRETAIRE|COMPTABLE|CLIENT|admin)'|\"(SUPER_ADMIN|ADMIN|ASSOCIE|AVOCAT|LAWYER|COLLABORATEUR|STAGIAIRE|SECRETAIRE|COMPTABLE|CLIENT|admin)\"" \
  src 2>/dev/null \
  | sort \
  | uniq -c \
  | sort -nr || true

echo
echo "== 3. Création du module UserRole =="

cat > src/lib/security/roles.ts <<'TS'
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
TS

echo "✓ roles.ts"

echo
echo "== 4. Recherche de la configuration NextAuth =="

AUTH_FILE="src/app/api/auth/[...nextauth]/route.ts"

if [[ ! -f "$AUTH_FILE" ]]; then
  echo "❌ $AUTH_FILE introuvable."
  echo "Le script s'arrête avant modification de authorization.ts."
  exit 1
fi

echo "✓ $AUTH_FILE trouvé"

echo
echo "== 5. Vérification des callbacks JWT/session =="

grep -n -A20 -B5 \
  -E 'token\.role|sUser\.role|session.*user|jwt.*async|session.*async' \
  "$AUTH_FILE" \
  | head -n 180 || true

echo
echo "== 6. Génération de authorization.ts =="

cat > src/lib/security/authorization.ts <<'TS'
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  normalizeRole,
  type UserRole,
} from './roles';

export type AuthorizedContext = {
  userId: string;
  tenantId: string;
  role: UserRole;
  clientId?: string;
  groups?: string[];
};

export function unauthorized() {
  return NextResponse.json(
    { error: 'Non authentifié' },
    { status: 401 },
  );
}

export function forbidden() {
  return NextResponse.json(
    { error: 'Accès interdit' },
    { status: 403 },
  );
}

/**
 * Récupère l'identité authentifiée côté serveur.
 *
 * SECURITY:
 * - userId vient de la session
 * - role vient de la session
 * - tenantId vient de la session
 * - jamais du body/query/params pour établir l'identité
 */
export async function requireAuthorizedContext(): Promise<AuthorizedContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  const role = normalizeRole(session.user.role);

  if (!role) {
    throw new Error('FORBIDDEN: invalid user role');
  }

  const tenantId = session.user.tenantId;

  /**
   * SUPER_ADMIN peut fonctionner sans tenant.
   * Tous les autres utilisateurs doivent appartenir à un tenant.
   */
  if (!tenantId && role !== 'SUPER_ADMIN') {
    throw new Error('FORBIDDEN: missing tenant');
  }

  return {
    userId: session.user.id,
    tenantId: tenantId ?? '',
    role,
    clientId: session.user.clientId,
    groups: session.user.groups ?? [],
  };
}

/**
 * Safe tenant constraint for Prisma queries.
 *
 * IMPORTANT:
 * Le tenantId doit provenir de requireAuthorizedContext().
 */
export function tenantWhere(
  tenantId: string,
  extra: Record<string, unknown> = {},
) {
  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required');
  }

  return {
    ...extra,
    tenantId,
  };
}

/**
 * Safe dossier constraint.
 */
export function dossierWhere(
  dossierId: string,
  tenantId: string,
  extra: Record<string, unknown> = {},
) {
  if (!dossierId) {
    throw new Error('SECURITY: dossierId is required');
  }

  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required');
  }

  return {
    ...extra,
    id: dossierId,
    tenantId,
  };
}
TS

echo "✓ authorization.ts"

echo
echo "== 7. Extension des types NextAuth =="

mkdir -p src/types

cat > src/types/next-auth.d.ts <<'TS'
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
      tenantId?: string;
      clientId?: string;
      groups?: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role?: string;
    tenantId?: string;
    clientId?: string;
    groups?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    tenantId?: string;
    clientId?: string;
    groups?: string[];
  }
}
TS

echo "✓ next-auth.d.ts"

echo
echo "== 8. Recherche des incohérences évidentes =="

echo
echo "--- admin minuscule ---"
grep -Rni \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude='*.bak*' \
  "'admin'\|\"admin\"" \
  src/app/api src/lib 2>/dev/null \
  | head -n 80 || true

echo
echo "--- LAWYER ---"
grep -Rni \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude='*.bak*' \
  "LAWYER" \
  src prisma 2>/dev/null \
  | head -n 100 || true

echo
echo "== 9. Vérification TypeScript =="

if command -v npm >/dev/null 2>&1; then
  npm run typecheck --if-present || true
fi

echo
echo "== 10. Prisma validate =="

npx prisma validate

echo
echo "========================================"
echo " RBAC centralisation préparée"
echo "========================================"
echo
echo "IMPORTANT :"
echo "1. Vérifie authOptions exporté depuis [...nextauth]/route.ts"
echo "2. Vérifie que session.user.id / tenantId / role existent réellement"
echo "3. Lance les tests"
echo "4. Ne migre PAS encore User.role en enum Prisma"
echo
echo "Backup : $BACKUP"
echo
echo "Prochaine étape recommandée :"
echo "  npm run typecheck"
echo "  npm test -- --runInBand"
echo "  git diff"
