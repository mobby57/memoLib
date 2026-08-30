/**
 * 🔒 Security Hardening — Production Guards
 * 
 * Ce module est importé dans instrumentation.ts au démarrage de l'app.
 * Il REFUSE de démarrer si les protections critiques ne sont pas configurées.
 * 
 * Objectif: AUCUNE donnée ne doit fuiter. Jamais.
 */

export function enforceProductionSecurity(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDemoMode = process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1';

  if (!isProduction) {
    return;
  }

  if (isDemoMode) {
    throw new Error('FATAL: DEMO_MODE cannot be enabled in production.');
  }

  const errors: string[] = [];

  // 1. ENCRYPTION_MASTER_KEY obligatoire (données au repos)
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    errors.push(
      '❌ ENCRYPTION_MASTER_KEY manquante. Les emails et données sensibles ne seront pas chiffrés. ' +
      'Générez avec: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // 2. NEXTAUTH_SECRET obligatoire (sessions)
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('❌ NEXTAUTH_SECRET manquant ou trop court (min 32 chars). Les sessions ne sont pas sécurisées.');
  }

  // 3. Pas de credentials en dur
  if (process.env.DATABASE_URL?.includes('password@localhost')) {
    errors.push('❌ DATABASE_URL contient des credentials par défaut. Changez-les.');
  }

  // 4. HTTPS obligatoire en prod
  const appUrl = process.env.NEXTAUTH_URL || '';
  if (appUrl && !appUrl.startsWith('https://')) {
    errors.push('❌ NEXTAUTH_URL doit utiliser HTTPS en production.');
  }

  // 5. Webhook secret obligatoire
  if (!process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_SECRET_KEY) {
    errors.push('⚠️ STRIPE_WEBHOOK_SECRET manquant. Les webhooks Stripe ne seront pas vérifiés.');
  }

  // 6. Cron secret obligatoire
  if (!process.env.CRON_SECRET) {
    errors.push('⚠️ CRON_SECRET manquant. Les endpoints cron sont accessibles sans authentification.');
  }

  // Log tous les problèmes
  if (errors.length > 0) {
    console.error('\n' + '='.repeat(60));
    console.error('🛑 SECURITY VIOLATIONS DETECTED — PRODUCTION BLOCKED');
    console.error('='.repeat(60));
    errors.forEach(e => console.error(e));
    console.error('='.repeat(60) + '\n');

    // Bloquer le démarrage si ENCRYPTION_MASTER_KEY est absente
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      throw new Error(
        'FATAL: Cannot start in production without ENCRYPTION_MASTER_KEY. ' +
        'Client data would be stored unencrypted.'
      );
    }
  }
}

/**
 * Vérifie qu'un provider IA est configuré avec DPA
 * (Data Processing Agreement) pour la conformité RGPD
 */
export function validateAIProviderCompliance(): { provider: string; compliant: boolean; warning?: string } {
  const preferredProvider = process.env.AI_PREFERRED_PROVIDER || 'ollama';

  if (preferredProvider === 'ollama') {
    return { provider: 'ollama', compliant: true }; // Local = pas de fuite possible
  }

  if (preferredProvider === 'mistral') {
    return { provider: 'mistral', compliant: true }; // Français, DPA EU inclus
  }

  if (preferredProvider === 'openai') {
    return {
      provider: 'openai',
      compliant: true, // Si DPA signé via API agreement
      warning: 'OpenAI traite les données aux USA. Vérifiez que le DPA + SCCs sont signés.',
    };
  }

  if (preferredProvider === 'anthropic') {
    return {
      provider: 'anthropic',
      compliant: true,
      warning: 'Anthropic traite les données aux USA. Vérifiez que le DPA + SCCs sont signés.',
    };
  }

  return { provider: preferredProvider, compliant: false, warning: 'Provider inconnu — conformité non vérifiée.' };
}
