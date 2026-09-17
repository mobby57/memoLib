'use client';
/**
 * Composants UI pour le Feature Gating — MemoLib
 *
 * <FeatureGate feature="ai_draft_reply">
 *   <DraftReplyEditor />
 * </FeatureGate>
 *
 * Si la feature n'est pas disponible, affiche un prompt d'upgrade.
 */


import React from 'react';
import { useFeatureGate, Feature, ProductTier } from '@/hooks/useFeatureGate';
import { Lock, Sparkles, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

// ─── FEATURE GATE WRAPPER ────────────────────────────────────

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
  /** Composant de fallback personnalisé */
  fallback?: React.ReactNode;
  /** Mode : 'block' masque complètement, 'blur' montre en flou avec overlay */
  mode?: 'block' | 'blur' | 'badge';
}

export function FeatureGate({
  feature,
  children,
  fallback,
  mode = 'block',
}: FeatureGateProps) {
  const { check, isLoading } = useFeatureGate();

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded-lg" />;
  }

  const result = check(feature);

  if (result.allowed) {
    return <>{children}</>;
  }

  // Fallback personnalisé
  if (fallback) {
    return <>{fallback}</>;
  }

  // Mode blur : montre le contenu flouté avec overlay
  if (mode === 'blur') {
    return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
          <UpgradePrompt feature={feature} compact />
        </div>
      </div>
    );
  }

  // Mode badge : juste un petit badge "Pro" à côté
  if (mode === 'badge') {
    return (
      <div className="relative opacity-50 pointer-events-none">
        {children}
        <span className="absolute top-1 right-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          {result.requiredTierLabel}
        </span>
      </div>
    );
  }

  // Mode block (default)
  return <UpgradePrompt feature={feature} />;
}

// ─── UPGRADE PROMPT ──────────────────────────────────────────

const FEATURE_LABELS: Partial<Record<Feature, string>> = {
  ai_draft_reply: 'Brouillon de réponse IA',
  ai_email_summary: 'Résumé IA d\'email',
  ai_copilot_ceseda: 'Copilot CESEDA',
  ai_classification: 'Classification automatique',
  ai_deadline_extraction: 'Extraction IA des délais',
  ai_advanced_analytics: 'Analytics IA avancées',
  documents_generation: 'Génération de documents',
  documents_ocr: 'OCR intelligent',
  jurisprudence_search: 'Recherche jurisprudence',
  client_portal: 'Portail client',
  emails_inbound: 'Réception email automatique',
  emails_auto_reminders: 'Relances automatiques',
  workflows_advanced: 'Workflows avancés',
  compliance_hash_chain: 'Audit trail chaîné',
  reporting_advanced: 'Reporting avancé',
  dossiers_advanced_search: 'Recherche avancée',
};

interface UpgradePromptProps {
  feature: Feature;
  compact?: boolean;
}

export function UpgradePrompt({ feature, compact = false }: UpgradePromptProps) {
  const { check } = useFeatureGate();
  const result = check(feature);
  const label = FEATURE_LABELS[feature] || feature.replace(/_/g, ' ');

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Lock className="w-4 h-4 text-indigo-500" />
          <span>Plan {result.requiredTierLabel} requis</span>
        </div>
        <Link
          href="/settings/billing?upgrade=true"
          className="text-xs text-indigo-600 hover:text-indigo-800 underline"
        >
          Mettre à niveau →
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
        <Sparkles className="w-6 h-6 text-indigo-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {label}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Cette fonctionnalité est disponible à partir du plan{' '}
        <span className="font-semibold text-indigo-600">{result.requiredTierLabel}</span>.
        Votre plan actuel : {TIER_LABELS_FR[result.currentTier]}.
      </p>

      <Link
        href="/settings/billing?upgrade=true"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <ArrowUpRight className="w-4 h-4" />
        Passer au plan {result.requiredTierLabel}
      </Link>
    </div>
  );
}

const TIER_LABELS_FR: Record<ProductTier, string> = {
  PILOT: 'Essai',
  SOLO: 'Solo',
  CABINET: 'Cabinet',
  ENTERPRISE: 'Enterprise',
};

// ─── CONDITIONAL RENDER HELPER ───────────────────────────────

/**
 * Render conditionnel inline sans wrapper div
 *
 * Usage :
 *   <IfFeature feature="ai_draft_reply">
 *     <button>Générer brouillon</button>
 *   </IfFeature>
 */
interface IfFeatureProps {
  feature: Feature;
  children: React.ReactNode;
  /** Si true, affiche le children désactivé (opacity + disabled) au lieu de le masquer */
  showDisabled?: boolean;
}

export function IfFeature({ feature, children, showDisabled = false }: IfFeatureProps) {
  const { can, isLoading } = useFeatureGate();

  if (isLoading) return null;
  
  if (can(feature)) {
    return <>{children}</>;
  }

  if (showDisabled) {
    return (
      <span className="opacity-40 pointer-events-none cursor-not-allowed">
        {children}
      </span>
    );
  }

  return null;
}
