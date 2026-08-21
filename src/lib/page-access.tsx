'use client';

import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';
import Link from 'next/link';

const PAGE_ACCESS: Record<string, string[]> = {
  '/dashboard': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR', 'STAGIAIRE', 'SECRETAIRE', 'COMPTABLE'],
  '/dossiers': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR', 'STAGIAIRE', 'SECRETAIRE'],
  '/emails': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR', 'SECRETAIRE'],
  '/clients': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR', 'SECRETAIRE'],
  '/documents': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR', 'STAGIAIRE'],
  '/calendrier': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR', 'STAGIAIRE', 'SECRETAIRE'],
  '/factures': ['ADMIN', 'ASSOCIE', 'COMPTABLE'],
  '/analytics': ['ADMIN', 'ASSOCIE'],
  '/admin': ['ADMIN', 'ASSOCIE'],
  '/super-admin': ['SUPER_ADMIN'],
  '/settings': ['ADMIN', 'ASSOCIE', 'AVOCAT'],
  '/ai-assistant': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR'],
  '/advanced': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR'],
  '/exports': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COMPTABLE'],
  '/templates': ['ADMIN', 'ASSOCIE', 'AVOCAT', 'COLLABORATEUR'],
  '/workspaces': ['ADMIN', 'ASSOCIE', 'AVOCAT'],
  '/workflows': ['ADMIN', 'ASSOCIE'],
  '/billing': ['ADMIN', 'ASSOCIE', 'COMPTABLE'],
  '/client': ['CLIENT'],
  '/client-dashboard': ['CLIENT'],
};

export function getAccessiblePages(role: string): string[] {
  return Object.entries(PAGE_ACCESS)
    .filter(([, roles]) => roles.includes(role))
    .map(([path]) => path);
}

// Pages disabled by feature flags (beta)
// These pages are hidden regardless of role when the module is disabled
const PAGE_FEATURE_GATES: Record<string, string> = {
  '/admin/comptabilite': 'FEATURE_COMPTABILITE',
  '/admin/multichannel': 'FEATURE_MULTICHANNEL',
  '/super-admin': 'FEATURE_SUPER_ADMIN',
  '/workflows': 'FEATURE_WORKSPACE_REASONING',
  '/workspaces': 'FEATURE_WORKSPACE_REASONING',
};

function isFeaturePageEnabled(cleanPath: string): boolean {
  for (const [prefix, envKey] of Object.entries(PAGE_FEATURE_GATES)) {
    if (cleanPath.startsWith(prefix)) {
      // In client components, env vars are only available if prefixed NEXT_PUBLIC_
      // For server components or if env is exposed:
      if (typeof window !== 'undefined') {
        // Client-side: check a global config (injected by layout)
        const config = (window as any).__MEMOLIB_FEATURES__;
        if (config && config[envKey] === false) return false;
      }
      // Default: show the page (feature gate is enforced at API level by middleware)
      return true;
    }
  }
  return true;
}

export function canAccessPage(role: string, path: string): boolean {
  const cleanPath = path.replace(/^\/[a-z]{2}/, '');

  // Check feature gate first
  if (!isFeaturePageEnabled(cleanPath)) return false;

  const matched = Object.entries(PAGE_ACCESS)
    .filter(([prefix]) => cleanPath.startsWith(prefix))
    .sort((a, b) => b[0].length - a[0].length)[0];
  if (!matched) return true;
  return matched[1].includes(role);
}

interface PageGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function PageGuard({ children, requiredRoles }: PageGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') window.location.href = '/fr/auth/login';
    return null;
  }

  const userRole = (user as any)?.role || '';

  if (requiredRoles && !requiredRoles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Accès restreint</h2>
          <p className="text-sm text-gray-500 mb-4">
            Cette page n&apos;est pas accessible avec votre rôle ({userRole}).
          </p>
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
