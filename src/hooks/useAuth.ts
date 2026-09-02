'use client';

import { useOrganization, useUser } from '@clerk/nextjs';
import { UserPermissions, UserRole } from '@/types';

const defaultPermissions: UserPermissions = {
  canManageTenants: false,
  canManageClients: false,
  canManageDossiers: false,
  canViewOwnDossier: false,
  canManageFactures: false,
  canViewOwnFactures: false,
  canAccessAnalytics: false,
  canManageUsers: false,
};

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  tenantName?: string;
  tenantPlan?: string;
  clientId?: string;
  permissions: UserPermissions;
};

export interface UseAuthReturn {
  user: AppUser | null;
  session: { user: AppUser } | null;
  data: { user: AppUser } | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isClient: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  canAccessTenant: (tenantId: string) => boolean;
  canAccessClient: (clientId: string) => boolean;
  requireAuth: () => void;
}

function metadataString(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function metadataPermissions(metadata: Record<string, unknown>): UserPermissions {
  const value = metadata.permissions;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultPermissions;
  }

  const candidate = value as Record<string, unknown>;
  return {
    canManageTenants: candidate.canManageTenants === true,
    canManageClients: candidate.canManageClients === true,
    canManageDossiers: candidate.canManageDossiers === true,
    canViewOwnDossier: candidate.canViewOwnDossier === true,
    canManageFactures: candidate.canManageFactures === true,
    canViewOwnFactures: candidate.canViewOwnFactures === true,
    canAccessAnalytics: candidate.canAccessAnalytics === true,
    canManageUsers: candidate.canManageUsers === true,
  };
}

export function useAuth(): UseAuthReturn {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { organization } = useOrganization();
  const metadata = (clerkUser?.publicMetadata ?? {}) as Record<string, unknown>;
  const role = (metadataString(metadata, 'role') ?? 'CLIENT') as UserRole;
  const permissions = metadataPermissions(metadata);
  const user =
    isSignedIn && clerkUser
      ? {
          id: clerkUser.id,
          name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.primaryEmailAddress?.emailAddress ?? '',
          email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
          role,
          tenantId: organization?.id ?? metadataString(metadata, 'tenantId'),
          tenantName: organization?.name ?? metadataString(metadata, 'tenantName'),
          tenantPlan: metadataString(metadata, 'tenantPlan'),
          clientId: metadataString(metadata, 'clientId'),
          permissions,
        }
      : null;
  const isLoading = !isLoaded;
  const status = isLoading ? 'loading' : user ? 'authenticated' : 'unauthenticated';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';

  const session = user ? { user } : null;

  return {
    user,
    session,
    data: session,
    status,
    isLoading,
    isAuthenticated: user !== null,
    isSuperAdmin,
    isAdmin,
    isClient,
    hasRole: expectedRole => user?.role === expectedRole,
    hasPermission: permission => user?.permissions[permission] === true,
    canAccessTenant: tenantId => isSuperAdmin || (isAdmin && user?.tenantId === tenantId),
    canAccessClient: clientId => isSuperAdmin || isAdmin || (isClient && user?.clientId === clientId),
    requireAuth: () => {
      if (!isSignedIn) {
        window.location.assign('/fr/sign-in');
      }
    },
  };
}
