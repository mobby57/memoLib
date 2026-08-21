export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    // 🔒 SÉCURITÉ: Vérifications obligatoires au démarrage
    try {
      const { enforceProductionSecurity } = await import('@/lib/security/production-guards');
      enforceProductionSecurity();
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[SECURITY] Production guard FAILED:', error);
        throw error; // BLOQUE le démarrage en production
      }
    }

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
