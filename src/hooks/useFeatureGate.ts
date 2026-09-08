/**
 * Hook React — Feature Gate Client
 *
 * Permet aux composants de vérifier les features disponibles
 * et d'afficher des prompts d'upgrade quand nécessaire.
 *
 * Usage :
 *   const { can, check, gate } = useFeatureGate();
 *
 *   if (!can('ai_draft_reply')) {
 *     return <UpgradePrompt feature="ai_draft_reply" />;
 *   }
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Types reproduits côté client (pas d'import server)
export type ProductTier = 'PILOT' | 'SOLO' | 'CABINET' | 'ENTERPRISE';

export type Feature =
  | 'dossiers_create' | 'dossiers_checklist' | 'dossiers_compliance_gate'
  | 'dossiers_timeline' | 'dossiers_advanced_search' | 'dossiers_bulk_actions'
  | 'deadlines_alerts' | 'deadlines_custom' | 'deadlines_calendar_sync'
  | 'documents_upload' | 'documents_antivirus' | 'documents_generation'
  | 'documents_ocr' | 'documents_versioning'
  | 'ai_email_summary' | 'ai_draft_reply' | 'ai_classification'
  | 'ai_copilot_ceseda' | 'ai_deadline_extraction' | 'ai_advanced_analytics'
  | 'emails_inbound' | 'emails_auto_processing' | 'emails_auto_reminders'
  | 'jurisprudence_search'
  | 'client_portal' | 'client_portal_upload'
  | 'workflows_basic' | 'workflows_advanced' | 'workflows_custom_rules'
  | 'integrations_stripe' | 'integrations_outlook' | 'integrations_google' | 'integrations_api'
  | 'compliance_audit_trail' | 'compliance_hash_chain' | 'compliance_rgpd_export' | 'compliance_rgpd_erasure'
  | 'multi_tenant_sub_offices' | 'multi_tenant_rbac_full'
  | 'reporting_dashboard' | 'reporting_advanced' | 'reporting_export'
  | 'support_priority' | 'support_dedicated';

// Même mapping que côté serveur — source de vérité client
const TIER_ORDER: Record<ProductTier, number> = {
  PILOT: 0,
  SOLO: 1,
  CABINET: 2,
  ENTERPRISE: 3,
};

const FEATURE_TIERS: Record<Feature, ProductTier> = {
  dossiers_create: 'PILOT',
  dossiers_checklist: 'PILOT',
  dossiers_compliance_gate: 'PILOT',
  dossiers_timeline: 'SOLO',
  dossiers_advanced_search: 'CABINET',
  dossiers_bulk_actions: 'CABINET',
  deadlines_alerts: 'PILOT',
  deadlines_custom: 'CABINET',
  deadlines_calendar_sync: 'CABINET',
  documents_upload: 'PILOT',
  documents_antivirus: 'PILOT',
  documents_generation: 'CABINET',
  documents_ocr: 'ENTERPRISE',
  documents_versioning: 'CABINET',
  ai_email_summary: 'SOLO',
  ai_draft_reply: 'CABINET',
  ai_classification: 'SOLO',
  ai_copilot_ceseda: 'CABINET',
  ai_deadline_extraction: 'SOLO',
  ai_advanced_analytics: 'ENTERPRISE',
  emails_inbound: 'SOLO',
  emails_auto_processing: 'CABINET',
  emails_auto_reminders: 'CABINET',
  jurisprudence_search: 'CABINET',
  client_portal: 'CABINET',
  client_portal_upload: 'CABINET',
  workflows_basic: 'SOLO',
  workflows_advanced: 'ENTERPRISE',
  workflows_custom_rules: 'ENTERPRISE',
  integrations_stripe: 'SOLO',
  integrations_outlook: 'ENTERPRISE',
  integrations_google: 'ENTERPRISE',
  integrations_api: 'ENTERPRISE',
  compliance_audit_trail: 'SOLO',
  compliance_hash_chain: 'ENTERPRISE',
  compliance_rgpd_export: 'CABINET',
  compliance_rgpd_erasure: 'CABINET',
  multi_tenant_sub_offices: 'ENTERPRISE',
  multi_tenant_rbac_full: 'ENTERPRISE',
  reporting_dashboard: 'PILOT',
  reporting_advanced: 'ENTERPRISE',
  reporting_export: 'CABINET',
  support_priority: 'ENTERPRISE',
  support_dedicated: 'ENTERPRISE',
};

const TIER_LABELS: Record<ProductTier, string> = {
  PILOT: 'Essai',
  SOLO: 'Solo',
  CABINET: 'Cabinet',
  ENTERPRISE: 'Enterprise',
};

export interface FeatureCheckResult {
  allowed: boolean;
  feature: Feature;
  currentTier: ProductTier;
  requiredTier: ProductTier;
  upgradeRequired: boolean;
  requiredTierLabel: string;
}

export interface UseFeatureGateResult {
  /** Vérifie rapidement si une feature est accessible */
  can: (feature: Feature) => boolean;
  /** Vérifie avec détails complets */
  check: (feature: Feature) => FeatureCheckResult;
  /** Tier actuel de l'utilisateur */
  currentTier: ProductTier;
  /** Label du tier actuel */
  currentTierLabel: string;
  /** Chargement initial */
  isLoading: boolean;
  /** Toutes les features disponibles */
  availableFeatures: Feature[];
}

/**
 * Résout le tier depuis le session user
 */
function resolveTierFromSession(session: any): ProductTier {
  const planName = session?.user?.planName || session?.user?.plan || '';
  const key = String(planName).trim().toUpperCase();

  switch (key) {
    case 'PILOT':
    case 'STARTER':
    case 'FREE':
    case 'ESSAI':
      return 'PILOT';
    case 'SOLO':
      return 'SOLO';
    case 'CABINET':
    case 'PRO':
    case 'AGENCY':
      return 'CABINET';
    case 'ENTERPRISE':
    case 'CORPORATE':
      return 'ENTERPRISE';
    default:
      return 'SOLO'; // default raisonnable
  }
}

/**
 * Hook principal pour le feature gating côté client
 */
export function useFeatureGate(): UseFeatureGateResult {
  const { data: session, status, user } = useAuth();
  const isLoading = status === 'loading';

  const currentTier = useMemo(
    () => resolveTierFromSession(session),
    [session]
  );

  const can = useCallback(
    (feature: Feature): boolean => {
      const requiredTier = FEATURE_TIERS[feature];
      if (!requiredTier) return false;
      return TIER_ORDER[currentTier] >= TIER_ORDER[requiredTier];
    },
    [currentTier]
  );

  const check = useCallback(
    (feature: Feature): FeatureCheckResult => {
      const requiredTier = FEATURE_TIERS[feature];
      const allowed = can(feature);

      return {
        allowed,
        feature,
        currentTier,
        requiredTier,
        upgradeRequired: !allowed,
        requiredTierLabel: TIER_LABELS[requiredTier],
      };
    },
    [can, currentTier]
  );

  const availableFeatures = useMemo(
    () => (Object.entries(FEATURE_TIERS) as [Feature, ProductTier][])
      .filter(([, requiredTier]) => TIER_ORDER[currentTier] >= TIER_ORDER[requiredTier])
      .map(([feature]) => feature),
    [currentTier]
  );

  return {
    can,
    check,
    currentTier,
    currentTierLabel: TIER_LABELS[currentTier],
    isLoading,
    availableFeatures,
  };
}



