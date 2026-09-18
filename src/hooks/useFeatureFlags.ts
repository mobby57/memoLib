'use client';

import { useCallback } from 'react';
import { useSettings } from '@/hooks/useSettings';

/**
 * useFeatureFlags — fonctionnalités toggables PAR CABINET (tenant), issues de
 * TenantSettings (via useSettings → API → DB).
 *
 * À distinguer de useFeatureGate (src/hooks/useFeatureGate.ts) qui gère le
 * PLAN/tier commercial (PILOT/SOLO/CABINET/ENTERPRISE). Ici il s'agit de
 * bascules d'activation propres au cabinet (ex: OCR activé, IA activée).
 *
 * Fallback sécurisé : tant que la config n'est pas chargée (ou en erreur), les
 * flags sont considérés comme DÉSACTIVÉS — on n'affiche pas une fonctionnalité
 * par défaut si on ne sait pas encore si le cabinet l'a activée.
 * (Exception : les flags dont le défaut métier est "activé" sont listés dans
 *  DEFAULT_ENABLED pour éviter de masquer l'IA pendant le chargement initial.)
 */

export type TenantFeatureFlag = 'ocrEnabled' | 'aiEnabled';

/** Flags dont l'absence de donnée doit être traitée comme "activé". */
const DEFAULT_ENABLED: Record<TenantFeatureFlag, boolean> = {
  ocrEnabled: false,
  aiEnabled: true,
};

export interface UseFeatureFlagsResult {
  isLoading: boolean;
  isError: boolean;
  /** Retourne l'état d'un flag tenant, avec fallback sécurisé. */
  isEnabled: (flag: TenantFeatureFlag) => boolean;
  flags: Record<TenantFeatureFlag, boolean>;
}

export function useFeatureFlags(): UseFeatureFlagsResult {
  const { data, isLoading, isError } = useSettings();

  const isEnabled = useCallback(
    (flag: TenantFeatureFlag): boolean => {
      if (data && typeof data[flag] === 'boolean') {
        return data[flag] as boolean;
      }
      // Pas encore de donnée fiable → fallback métier par flag.
      return DEFAULT_ENABLED[flag];
    },
    [data]
  );

  return {
    isLoading,
    isError,
    isEnabled,
    flags: {
      ocrEnabled: isEnabled('ocrEnabled'),
      aiEnabled: isEnabled('aiEnabled'),
    },
  };
}
