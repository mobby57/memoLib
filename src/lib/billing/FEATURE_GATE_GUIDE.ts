import { auth } from '@/lib/clerk-auth';
/**
 * Feature Gate — Guide d'intégration
 *
 * Ce fichier montre comment intégrer le feature gating dans MemoLib.
 * Deux patterns disponibles : HOF middleware ou inline check.
 *
 * ════════════════════════════════════════════════════════════════
 * PATTERN 1 : HOF Middleware (recommandé pour les nouvelles routes)
 * ════════════════════════════════════════════════════════════════
 *
 * import { withFeatureGate } from '@/lib/billing/feature-gate-middleware';
 *
 * export const POST = withFeatureGate('ai_draft_reply', async (request, context) => {
 *   // Ce code ne s'exécute QUE si le tenant a le plan requis (CABINET+)
 *   const body = await request.json();
 *   // ... logique métier
 *   return NextResponse.json({ success: true });
 * });
 *
 * ════════════════════════════════════════════════════════════════
 * PATTERN 2 : Inline check (pour routes existantes)
 * ════════════════════════════════════════════════════════════════
 *
 * import { checkFeatureAccess } from '@/lib/billing/features';
 *
 * export async function POST(req: NextRequest) {
 *   const { user } = await auth();
    const session = user ? { user } : null;
 *   const tenantId = (user as any)?.tenantId;
 *
 *   // Ajouter cette vérification au début de la route
 *   const featureCheck = await checkFeatureAccess(tenantId, 'ai_draft_reply');
 *   if (!featureCheck.allowed) {
 *     return NextResponse.json(featureCheck, { status: 403 });
 *   }
 *
 *   // ... reste du code existant inchangé
 * }
 *
 * ════════════════════════════════════════════════════════════════
 * PATTERN 3 : Composant React (UI)
 * ════════════════════════════════════════════════════════════════
 *
 * import { FeatureGate, IfFeature } from '@/components/billing/FeatureGate';
 *
 * // Wrapper complet avec prompt d'upgrade
 * <FeatureGate feature="ai_copilot_ceseda">
 *   <CopilotCesedaPanel dossierId={id} />
 * </FeatureGate>
 *
 * // Version blur (montre un aperçu flouté)
 * <FeatureGate feature="reporting_advanced" mode="blur">
 *   <AdvancedReportingDashboard />
 * </FeatureGate>
 *
 * // Bouton conditionnel (masqué si pas disponible)
 * <IfFeature feature="ai_draft_reply">
 *   <button onClick={generateDraft}>Générer brouillon IA</button>
 * </IfFeature>
 *
 * // Bouton désactivé visuellement (visible mais inactif)
 * <IfFeature feature="documents_ocr" showDisabled>
 *   <button>OCR intelligent</button>
 * </IfFeature>
 *
 * ════════════════════════════════════════════════════════════════
 * PATTERN 4 : Hook React
 * ════════════════════════════════════════════════════════════════
 *
 * import { useFeatureGate } from '@/hooks/useFeatureGate';
 *
 * function MyComponent() {
 *   const { can, check, currentTier, nextTierFeatures } = useFeatureGate();
 *
 *   // Vérification simple
 *   if (!can('ai_copilot_ceseda')) {
 *     return <UpgradePrompt feature="ai_copilot_ceseda" />;
 *   }
 *
 *   // Vérification avec détails (pour affichage conditionnel)
 *   const draftCheck = check('ai_draft_reply');
 *   // draftCheck.allowed, draftCheck.requiredTier, draftCheck.message
 *
 *   return <div>...</div>;
 * }
 */

// ─── ROUTES À PROTÉGER (plan d'action) ──────────────────────
//
// | Route                               | Feature               | Tier requis |
// |-------------------------------------|-----------------------|-------------|
// | POST /api/ai/draft-reply            | ai_draft_reply        | CABINET     |
// | POST /api/ai/summarize-email        | ai_email_summary      | SOLO        |
// | GET  /api/jurisprudence/search      | jurisprudence_search  | CABINET     |
// | POST /api/documents/generate        | documents_generation  | CABINET     |
// | POST /api/emails/incoming           | emails_inbound        | SOLO        |
// | POST /api/dossiers/[id]/compliance  | dossiers_compliance_gate | PILOT    |
// | GET  /api/analytics/advanced        | ai_advanced_analytics | ENTERPRISE  |
// | POST /api/workflows/execute         | workflows_advanced    | ENTERPRISE  |
// | POST /api/documents/ocr             | documents_ocr         | ENTERPRISE  |
//
// ─── MIGRATION PROGRESSIVE ──────────────────────────────────
//
// Phase 1 : Ajouter le inline check aux routes IA (2 lignes)
// Phase 2 : Migrer les nouvelles routes vers withFeatureGate
// Phase 3 : Ajouter <FeatureGate> sur les composants UI
// Phase 4 : Ajouter le upsell (nextTierFeatures) dans le dashboard
//

export {};


