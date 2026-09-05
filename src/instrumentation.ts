import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Garde-fou sécurité : refuse de démarrer en prod sans les protections
    // critiques (ENCRYPTION_MASTER_KEY, etc.). Données juridiques sensibles.
    const { enforceProductionSecurity } = await import('./lib/security/production-guards');
    enforceProductionSecurity();

    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
