'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * useIntakeNeedsHelp — demandes clients nécessitant une intervention.
 * Source serveur (TanStack Query), cohérent avec useSettings. Pas de React
 * Context dédié (l'état vit dans le cache Query).
 */

export interface IntakeSummary {
  id: string;
  tenantId: string;
  type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'NEEDS_HELP';
  origin: string;
  completeness: number;
  createdAt: string;
  updatedAt: string;
}

export const intakeKeys = {
  all: ['intake'] as const,
  needsHelp: () => [...intakeKeys.all, 'needs-help'] as const,
  detail: (id: string) => [...intakeKeys.all, 'detail', id] as const,
  uploadedFiles: (id: string) => [...intakeKeys.all, 'files', id] as const,
};

async function fetchNeedsHelp(): Promise<{ items: IntakeSummary[]; count: number }> {
  const res = await fetch('/api/intake/needs-help', { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

export function useIntakeNeedsHelp() {
  return useQuery({
    queryKey: intakeKeys.needsHelp(),
    queryFn: fetchNeedsHelp,
    // Rafraîchit régulièrement : ces demandes doivent "remonter" vite.
    refetchInterval: 60_000,
  });
}
