/**
 * Feature Flags par Plan — MemoLib
 *
 * Système déclaratif de gating des fonctionnalités par tier.
 * Chaque feature est associée au tier minimum requis pour y accéder.
 *
 * Usage :
 *   const gate = await getFeatureGate(tenantId);
 *   if (!gate.can('ai_draft_reply')) { return 403; }
 *
 *   // Ou en middleware :
 *   const check = await checkFeatureAccess(tenantId, 'ai_draft_reply');
 *   if (!check.allowed) { return NextResponse.json(check, { status: 403 }); }
 */

import { ProductTier, PRODUCT_TIERS, resolveProductTier } from './plans';
import { prisma } from '@/lib/prisma';

// ─── FEATURE CATALOG ─────────────────────────────────────────

/**
 * Toutes les features gatable de l'application.
 * Organisées par domaine fonctionnel.
 */
export type Feature =
  // ── Dossiers & Checklist ──
  | 'dossiers_create'              // Créer un dossier
  | 'dossiers_checklist'           // Checklist de complétude
  | 'dossiers_compliance_gate'     // Gate bloquant avant dépôt
  | 'dossiers_timeline'            // Timeline automatique
  | 'dossiers_advanced_search'     // Recherche avancée multi-critères
  | 'dossiers_bulk_actions'        // Actions groupées

  // ── Alertes & Deadlines ──
  | 'deadlines_alerts'             // Alertes J-7, J-3, J-1
  | 'deadlines_custom'             // Alertes personnalisées
  | 'deadlines_calendar_sync'      // Sync calendrier (Google/Outlook)

  // ── Documents ──
  | 'documents_upload'             // Upload de pièces
  | 'documents_antivirus'          // Scan antivirus
  | 'documents_generation'         // Génération courriers (6 templates)
  | 'documents_ocr'                // OCR + classement intelligent
  | 'documents_versioning'         // Historique des versions

  // ── IA ──
  | 'ai_email_summary'             // Résumé IA d'un email
  | 'ai_draft_reply'               // Brouillon de réponse IA
  | 'ai_classification'            // Classification auto des dossiers
  | 'ai_copilot_ceseda'            // Copilot CESEDA (analyse complète)
  | 'ai_deadline_extraction'       // Extraction IA des délais
  | 'ai_advanced_analytics'        // Analytics IA avancées

  // ── Emails ──
  | 'emails_inbound'               // Réception email (webhook)
  | 'emails_auto_processing'       // Traitement auto à la réception
  | 'emails_auto_reminders'        // Relances automatiques

  // ── Jurisprudence ──
  | 'jurisprudence_search'         // Recherche Légifrance

  // ── Client Portal ──
  | 'client_portal'                // Portail client sécurisé
  | 'client_portal_upload'         // Upload par le client

  // ── Workflows ──
  | 'workflows_basic'              // Workflows simples (statut auto)
  | 'workflows_advanced'           // Workflows avancés (multi-étapes)
  | 'workflows_custom_rules'       // Règles personnalisées

  // ── Intégrations ──
  | 'integrations_stripe'          // Facturation Stripe
  | 'integrations_outlook'         // Sync Outlook
  | 'integrations_google'          // Sync Google
  | 'integrations_api'             // Accès API REST

  // ── Conformité ──
  | 'compliance_audit_trail'       // Audit trail basique
  | 'compliance_hash_chain'        // Audit trail chaîné (hash chain)
  | 'compliance_rgpd_export'       // Export RGPD
  | 'compliance_rgpd_erasure'      // Droit à l'oubli

  // ── Multi-tenant ──
  | 'multi_tenant_sub_offices'     // Sous-cabinets
  | 'multi_tenant_rbac_full'       // RBAC complet (9 rôles)

  // ── Reporting ──
  | 'reporting_dashboard'          // Tableau de bord basique
  | 'reporting_advanced'           // Reporting avancé (rentabilité, charge)
  | 'reporting_export'             // Export PDF/CSV

  // ── Support ──
  | 'support_priority'             // Support prioritaire
  | 'support_dedicated';           // Account manager dédié

// ─── TIER HIERARCHY ──────────────────────────────────────────

/**
 * Ordre hiérarchique des tiers.
 * Un tier supérieur inclut toutes les features des tiers inférieurs.
 */
const TIER_ORDER: Record<ProductTier, number> = {
  PILOT: 0,
  SOLO: 1,
  CABINET: 2,
  ENTERPRISE: 3,
};

// ─── FEATURE → MINIMUM TIER ─────────────────────────────────

/**
 * Mapping déclaratif : chaque feature → tier minimum requis.
 * Les tiers supérieurs héritent automatiquement.
 */
const FEATURE_TIERS: Record<Feature, ProductTier> = {
  // ── Dossiers (PILOT+) ──
  dossiers_create: 'PILOT',
  dossiers_checklist: 'PILOT',
  dossiers_compliance_gate: 'PILOT',
  dossiers_timeline: 'SOLO',
  dossiers_advanced_search: 'CABINET',
  dossiers_bulk_actions: 'CABINET',

  // ── Alertes (PILOT+) ──
  deadlines_alerts: 'PILOT',
  deadlines_custom: 'CABINET',
  deadlines_calendar_sync: 'CABINET',

  // ── Documents (PILOT+) ──
  documents_upload: 'PILOT',
  documents_antivirus: 'PILOT',
  documents_generation: 'CABINET',
  documents_ocr: 'ENTERPRISE',
  documents_versioning: 'CABINET',

  // ── IA (SOLO+) ──
  ai_email_summary: 'SOLO',
  ai_draft_reply: 'CABINET',
  ai_classification: 'SOLO',
  ai_copilot_ceseda: 'CABINET',
  ai_deadline_extraction: 'SOLO',
  ai_advanced_analytics: 'ENTERPRISE',

  // ── Emails (SOLO+) ──
  emails_inbound: 'SOLO',
  emails_auto_processing: 'CABINET',
  emails_auto_reminders: 'CABINET',

  // ── Jurisprudence (CABINET+) ──
  jurisprudence_search: 'CABINET',

  // ── Client Portal (CABINET+) ──
  client_portal: 'CABINET',
  client_portal_upload: 'CABINET',

  // ── Workflows ──
  workflows_basic: 'SOLO',
  workflows_advanced: 'ENTERPRISE',
  workflows_custom_rules: 'ENTERPRISE',

  // ── Intégrations ──
  integrations_stripe: 'SOLO',
  integrations_outlook: 'ENTERPRISE',
  integrations_google: 'ENTERPRISE',
  integrations_api: 'ENTERPRISE',

  // ── Conformité ──
  compliance_audit_trail: 'SOLO',
  compliance_hash_chain: 'ENTERPRISE',
  compliance_rgpd_export: 'CABINET',
  compliance_rgpd_erasure: 'CABINET',

  // ── Multi-tenant ──
  multi_tenant_sub_offices: 'ENTERPRISE',
  multi_tenant_rbac_full: 'ENTERPRISE',

  // ── Reporting ──
  reporting_dashboard: 'PILOT',
  reporting_advanced: 'ENTERPRISE',
  reporting_export: 'CABINET',

  // ── Support ──
  support_priority: 'ENTERPRISE',
  support_dedicated: 'ENTERPRISE',
};

// ─── FEATURE GATE CLASS ──────────────────────────────────────

export interface FeatureCheckResult {
  allowed: boolean;
  feature: Feature;
  currentTier: ProductTier;
  requiredTier: ProductTier;
  upgradeRequired: boolean;
  message?: string;
}

export class FeatureGate {
  constructor(
    private readonly tier: ProductTier,
    private readonly tenantId?: string,
  ) {}

  /**
   * Vérifie si une feature est accessible au tier actuel
   */
  can(feature: Feature): boolean {
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) return false;
    return TIER_ORDER[this.tier] >= TIER_ORDER[requiredTier];
  }

  /**
   * Vérifie avec détails (pour API responses)
   */
  check(feature: Feature): FeatureCheckResult {
    const requiredTier = FEATURE_TIERS[feature];
    const allowed = this.can(feature);

    return {
      allowed,
      feature,
      currentTier: this.tier,
      requiredTier,
      upgradeRequired: !allowed,
      message: allowed
        ? undefined
        : `Cette fonctionnalité nécessite le plan ${PRODUCT_TIERS[requiredTier].name}. ` +
          `Votre plan actuel : ${PRODUCT_TIERS[this.tier].name}.`,
    };
  }

  /**
   * Vérifie plusieurs features à la fois
   */
  checkAll(features: Feature[]): Record<Feature, boolean> {
    const result: Partial<Record<Feature, boolean>> = {};
    for (const f of features) {
      result[f] = this.can(f);
    }
    return result as Record<Feature, boolean>;
  }

  /**
   * Retourne toutes les features disponibles pour ce tier
   */
  availableFeatures(): Feature[] {
    return (Object.entries(FEATURE_TIERS) as [Feature, ProductTier][])
      .filter(([, requiredTier]) => TIER_ORDER[this.tier] >= TIER_ORDER[requiredTier])
      .map(([feature]) => feature);
  }

  /**
   * Retourne les features du prochain tier (pour upsell)
   */
  nextTierFeatures(): { tier: ProductTier; features: Feature[] } | null {
    const nextTierOrder = TIER_ORDER[this.tier] + 1;
    const nextTier = (Object.entries(TIER_ORDER) as [ProductTier, number][])
      .find(([, order]) => order === nextTierOrder)?.[0];

    if (!nextTier) return null;

    const newFeatures = (Object.entries(FEATURE_TIERS) as [Feature, ProductTier][])
      .filter(([, requiredTier]) => requiredTier === nextTier)
      .map(([feature]) => feature);

    return { tier: nextTier, features: newFeatures };
  }

  get currentTier(): ProductTier {
    return this.tier;
  }
}

// ─── FACTORY FUNCTIONS ───────────────────────────────────────

/**
 * Crée un FeatureGate depuis le tenantId (requête DB)
 */
export async function getFeatureGate(tenantId: string): Promise<FeatureGate> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { Plan: true },
  });

  if (!tenant) {
    // Fallback sur PILOT (le plus restrictif)
    return new FeatureGate('PILOT', tenantId);
  }

  const tier = resolveProductTier(tenant.Plan.name);
  return new FeatureGate(tier, tenantId);
}

/**
 * Crée un FeatureGate depuis le nom du plan (sans DB)
 */
export function getFeatureGateFromPlan(planName: string): FeatureGate {
  const tier = resolveProductTier(planName);
  return new FeatureGate(tier);
}

/**
 * Vérifie l'accès à une feature pour un tenant (raccourci)
 */
export async function checkFeatureAccess(
  tenantId: string,
  feature: Feature
): Promise<FeatureCheckResult> {
  const gate = await getFeatureGate(tenantId);
  return gate.check(feature);
}

/**
 * Vérifie l'accès et lève une erreur si bloqué (pour les API routes)
 */
export async function requireFeature(
  tenantId: string,
  feature: Feature
): Promise<void> {
  const result = await checkFeatureAccess(tenantId, feature);
  if (!result.allowed) {
    throw new FeatureGateError(result);
  }
}

// ─── ERROR CLASS ─────────────────────────────────────────────

export class FeatureGateError extends Error {
  public readonly result: FeatureCheckResult;
  public readonly statusCode = 403;

  constructor(result: FeatureCheckResult) {
    super(result.message || `Feature ${result.feature} requires ${result.requiredTier} plan`);
    this.name = 'FeatureGateError';
    this.result = result;
  }

  toJSON() {
    return {
      error: 'FEATURE_GATED',
      feature: this.result.feature,
      currentTier: this.result.currentTier,
      requiredTier: this.result.requiredTier,
      message: this.result.message,
      upgradeUrl: '/settings/billing?upgrade=true',
    };
  }
}

// ─── CONSTANTS EXPORTS ───────────────────────────────────────

export { FEATURE_TIERS, TIER_ORDER };

/**
 * Helper : liste des features par catégorie (pour UI settings)
 */
export const FEATURE_CATEGORIES: Record<string, { label: string; features: Feature[] }> = {
  dossiers: {
    label: 'Gestion des dossiers',
    features: [
      'dossiers_create', 'dossiers_checklist', 'dossiers_compliance_gate',
      'dossiers_timeline', 'dossiers_advanced_search', 'dossiers_bulk_actions',
    ],
  },
  deadlines: {
    label: 'Délais & alertes',
    features: ['deadlines_alerts', 'deadlines_custom', 'deadlines_calendar_sync'],
  },
  documents: {
    label: 'Documents',
    features: [
      'documents_upload', 'documents_antivirus', 'documents_generation',
      'documents_ocr', 'documents_versioning',
    ],
  },
  ai: {
    label: 'Intelligence artificielle',
    features: [
      'ai_email_summary', 'ai_draft_reply', 'ai_classification',
      'ai_copilot_ceseda', 'ai_deadline_extraction', 'ai_advanced_analytics',
    ],
  },
  emails: {
    label: 'Emails',
    features: ['emails_inbound', 'emails_auto_processing', 'emails_auto_reminders'],
  },
  jurisprudence: {
    label: 'Jurisprudence',
    features: ['jurisprudence_search'],
  },
  client_portal: {
    label: 'Portail client',
    features: ['client_portal', 'client_portal_upload'],
  },
  workflows: {
    label: 'Automatisation',
    features: ['workflows_basic', 'workflows_advanced', 'workflows_custom_rules'],
  },
  integrations: {
    label: 'Intégrations',
    features: ['integrations_stripe', 'integrations_outlook', 'integrations_google', 'integrations_api'],
  },
  compliance: {
    label: 'Conformité',
    features: ['compliance_audit_trail', 'compliance_hash_chain', 'compliance_rgpd_export', 'compliance_rgpd_erasure'],
  },
  reporting: {
    label: 'Reporting',
    features: ['reporting_dashboard', 'reporting_advanced', 'reporting_export'],
  },
};
