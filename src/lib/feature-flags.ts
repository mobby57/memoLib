/**
 * MemoLib Beta Feature Flags
 * 
 * Controls which modules are enabled for the beta launch.
 * Disabled modules are blocked at middleware level (API returns 404).
 * 
 * Enable via environment variables: FEATURE_COMPTABILITE=true
 * 
 * Classification:
 *   - ALWAYS ON: auth, dossiers, clients, emails, documents, deadlines, 
 *                jurisprudence, ai-summarize, ai-draft, onboarding, health
 *   - FEATURE-GATED: everything below (disabled by default for beta)
 */

export type FeatureModule =
  | 'comptabilite'       // 11 routes — real implementation, 0 E2E tests
  | 'multichannel'       // WhatsApp, SMS, Teams adapters — real, 0 E2E
  | 'voice'             // Voice transcription — real (Ollama + fallback)
  | 'ocr'              // OCR text extraction — real, placeholder tests
  | 'github'           // GitHub sync dossiers — real Octokit integration
  | 'azure'            // Azure KeyVault + Blob — real SDK
  | 'calendar-sync'    // Google/Outlook calendar sync — real OAuth
  | 'ai-advanced'      // Copilot, risk-analysis, predict, strategy, recours
  | 'forms'            // Approval workflows, resource requests
  | 'questionnaire'    // Dynamic questionnaires per event
  | 'super-admin'      // Platform admin panel
  | 'subscriptions'    // Stripe subscription management
  | 'workspace-reasoning'; // CESDA workspace reasoning engine

function envBool(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  return val === 'true' || val === '1';
}

const BETA_FEATURES: Record<FeatureModule, boolean> = {
  'comptabilite': envBool('FEATURE_COMPTABILITE', false),
  'multichannel': envBool('FEATURE_MULTICHANNEL', false),
  'voice': envBool('FEATURE_VOICE', false),
  'ocr': envBool('FEATURE_OCR', false),
  'github': envBool('FEATURE_GITHUB', false),
  'azure': envBool('FEATURE_AZURE', false),
  'calendar-sync': envBool('FEATURE_CALENDAR_SYNC', false),
  'ai-advanced': envBool('FEATURE_AI_ADVANCED', false),
  'forms': envBool('FEATURE_FORMS', false),
  'questionnaire': envBool('FEATURE_QUESTIONNAIRE', false),
  'super-admin': envBool('FEATURE_SUPER_ADMIN', false),
  'subscriptions': envBool('FEATURE_SUBSCRIPTIONS', false),
  'workspace-reasoning': envBool('FEATURE_WORKSPACE_REASONING', false),
};

/**
 * Check if a feature module is enabled
 */
export function isFeatureEnabled(module: FeatureModule): boolean {
  return BETA_FEATURES[module] ?? false;
}

/**
 * Get all feature states (for admin/debug)
 */
export function getEnabledFeatures(): Record<FeatureModule, boolean> {
  return { ...BETA_FEATURES };
}

/**
 * Path prefix → feature module mapping, used to determine whether a given
 * API route belongs to a beta-gated module (mirrors middleware.ts DISABLED_API_PREFIXES).
 */
const MODULE_PATH_PREFIXES: { prefix: string; module: FeatureModule }[] = [
  { prefix: '/api/comptabilite', module: 'comptabilite' },
  { prefix: '/api/exports/fec', module: 'comptabilite' },
  { prefix: '/api/multichannel', module: 'multichannel' },
  { prefix: '/api/voice', module: 'voice' },
  { prefix: '/api/ocr', module: 'ocr' },
  { prefix: '/api/github', module: 'github' },
  { prefix: '/api/azure', module: 'azure' },
  { prefix: '/api/calendar/google-sync', module: 'calendar-sync' },
  { prefix: '/api/calendar/sync', module: 'calendar-sync' },
  { prefix: '/api/integrations/sync', module: 'calendar-sync' },
  { prefix: '/api/ai/copilot', module: 'ai-advanced' },
  { prefix: '/api/ai/predict-outcome', module: 'ai-advanced' },
  { prefix: '/api/ai/prepare-ofpra', module: 'ai-advanced' },
  { prefix: '/api/ai/risk-analysis', module: 'ai-advanced' },
  { prefix: '/api/ai/strategy', module: 'ai-advanced' },
  { prefix: '/api/ai/translate', module: 'ai-advanced' },
  { prefix: '/api/ai/generate-recours', module: 'ai-advanced' },
  { prefix: '/api/forms/approvals', module: 'forms' },
  { prefix: '/api/forms/resource-request', module: 'forms' },
  { prefix: '/api/forms/risk-assessment', module: 'forms' },
  { prefix: '/api/forms/strategic-decision', module: 'forms' },
  { prefix: '/api/questionnaire', module: 'questionnaire' },
  { prefix: '/api/super-admin', module: 'super-admin' },
  { prefix: '/api/subscriptions', module: 'subscriptions' },
  { prefix: '/api/workspace-reasoning', module: 'workspace-reasoning' },
];

/**
 * Given a request pathname, returns the blocked module name if it maps to a
 * disabled beta feature, or null if the route is allowed.
 */
export function getBlockedFeature(pathname: string): FeatureModule | null {
  for (const { prefix, module } of MODULE_PATH_PREFIXES) {
    if (pathname.startsWith(prefix) && !isFeatureEnabled(module)) {
      return module;
    }
  }
  return null;
}
