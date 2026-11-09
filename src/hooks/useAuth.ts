"use client";

import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";

interface UseAuthReturn {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    avatar: string | null;
    tenantId: string | null;
    tenantName: string | null;
    clientId: string | null;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Role helpers
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isClient: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();

  if (!isLoaded || !user) {
    return {
      user: null,
      isLoading: !isLoaded,
      isAuthenticated: false,
      isSuperAdmin: false,
      isAdmin: false,
      isClient: false,
      hasRole: () => false,
      hasPermission: () => false,
      signOut: async () => { await clerkSignOut(); },
    };
  }

  const meta = user.publicMetadata as { role?: string; tenantId?: string; tenantName?: string; clientId?: string; permissions?: string[] };
  const role = meta?.role ?? "USER";
  const permissions = meta?.permissions ?? [];

  const authUser = {
    id: user.id,
    name: user.fullName ?? user.firstName ?? "Utilisateur",
    email: user.primaryEmailAddress?.emailAddress ?? "",
    role,
    avatar: user.imageUrl ?? null,
    tenantId: meta?.tenantId ?? null,
    tenantName: meta?.tenantName ?? null,
    clientId: meta?.clientId ?? null,
  };

  return {
    user: authUser,
    isLoading: false,
    isAuthenticated: true,
    isSuperAdmin: role === "SUPER_ADMIN",
    isAdmin: role === "ADMIN" || role === "SUPER_ADMIN",
    isClient: role === "CLIENT",
    hasRole: (r: string) => role === r,
    hasPermission: (p: string) => permissions.includes(p),
    signOut: async () => { await clerkSignOut(); },
  };
}
