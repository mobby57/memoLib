export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // Vérification conformité hébergement EU au démarrage
    try {
      const { runComplianceChecks } = await import('@/lib/compliance/eu-hosting-check');
      runComplianceChecks();
    } catch {
      // Ne pas bloquer le démarrage si le check échoue
      console.warn('[COMPLIANCE] EU hosting check could not run');
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
