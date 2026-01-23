'use client';

import { useSession } from 'next-auth/react';
import { UserRole, UserPermissions } from '@/types';

export interface UseAuthReturn {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    tenantName?: string;
    tenantPlan?: string;
    clientId?: string;
    permissions: UserPermissions;
  } | null;
  session: any;
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

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  
  const user = session?.user as any;
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!user;
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';
  
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };
  
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!user?.permissions) return false;
    return user.permissions[permission] === true;
  };
  
  const canAccessTenant = (tenantId: string): boolean => {
    if (isSuperAdmin) return true;
    if (isAdmin) return user?.tenantId === tenantId;
    return false;
  };
  
  const canAccessClient = (clientId: string): boolean => {
    if (isSuperAdmin) return true;
    if (isAdmin) {
      // L'admin peut accéder aux clients de son tenant
      // Cette vérification devrait être faite côté serveur
      return true;
    }
    if (isClient) return user?.clientId === clientId;
    return false;
  };
  
  return {
    user: isAuthenticated ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenantName,
      tenantPlan: user.tenantPlan,
      clientId: user.clientId,
      permissions: user.permissions || {
        canManageTenants: false,
        canManageClients: false,
        canManageDossiers: false,
        canViewOwnDossier: false,
        canManageFactures: false,
        canViewOwnFactures: false,
        canAccessAnalytics: false,
        canManageUsers: false,
      },
    } : null,
    session,
    status,
    isLoading,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isClient,
    hasRole,
    hasPermission,
    canAccessTenant,
    canAccessClient,
    requireAuth: () => {
      if (!isAuthenticated) {
        window.location.href = '/auth/login';
      }
    },
  };
}
