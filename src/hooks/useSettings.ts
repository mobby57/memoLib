'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TenantSettingsPublic, TenantSettingsUpdate } from '@/lib/validation/settings.schema';

/**
 * useSettings — accès à la configuration cabinet (TenantSettings).
 *
 * Source de vérité : serveur (API /api/settings/tenant), via TanStack Query.
 * Zustand n'intervient PAS ici (ce sont des données serveur, pas de l'état UI).
 *
 * Chaîne : UI → useSettings (ici) → /api/settings/tenant → RBAC → service → DB.
 */

export const settingsKeys = {
  all: ['settings'] as const,
  tenant: () => [...settingsKeys.all, 'tenant'] as const,
};

async function fetchTenantSettings(): Promise<TenantSettingsPublic> {
  const res = await fetch('/api/settings/tenant', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const message = await safeError(res);
    throw new SettingsError(message, res.status);
  }
  return res.json();
}

async function patchTenantSettings(patch: TenantSettingsUpdate): Promise<TenantSettingsPublic> {
  const res = await fetch('/api/settings/tenant', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const message = await safeError(res);
    throw new SettingsError(message, res.status);
  }
  return res.json();
}

export class SettingsError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SettingsError';
    this.status = status;
  }
}

async function safeError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

/**
 * Lecture de la config cabinet (cache 5 min hérité du QueryClient global).
 */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.tenant(),
    queryFn: fetchTenantSettings,
    // Ne pas réessayer sur 401/403 (permission), inutile.
    retry: (failureCount, error) => {
      if (error instanceof SettingsError && (error.status === 401 || error.status === 403)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Mutation de la config cabinet, avec invalidation du cache après succès.
 * Optimistic update : on met à jour le cache immédiatement, rollback en cas d'échec.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchTenantSettings,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.tenant() });
      const previous = queryClient.getQueryData<TenantSettingsPublic>(settingsKeys.tenant());
      if (previous) {
        queryClient.setQueryData<TenantSettingsPublic>(settingsKeys.tenant(), {
          ...previous,
          ...patch,
        } as TenantSettingsPublic);
      }
      return { previous };
    },
    onError: (_err, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.tenant(), context.previous);
      }
    },
    onSettled: () => {
      // Re-synchronise avec le serveur (source de vérité).
      queryClient.invalidateQueries({ queryKey: settingsKeys.tenant() });
    },
  });
}
