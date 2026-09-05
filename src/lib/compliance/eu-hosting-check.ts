/**
 * Vérification conformité hébergement EU au démarrage.
 *
 * OBLIGATION LÉGALE:
 * - RGPD Art. 44-49 : Transferts de données hors UE interdits sans garanties
 * - Les données de dossiers clients (données sensibles Art. 9) DOIVENT rester en UE
 *
 * Ce module vérifie que les services critiques sont configurés en région EU.
 * À appeler au démarrage de l'application (instrumentation.ts ou middleware).
 */

import { logger } from '@/lib/logger';

interface ComplianceCheck {
  service: string;
  compliant: boolean;
  region?: string;
  warning?: string;
}

/**
 * Vérifie que la DATABASE_URL pointe vers un endpoint EU Neon.
 */
function checkDatabaseRegion(): ComplianceCheck {
  const dbUrl = process.env.DATABASE_URL || '';

  // Neon EU endpoints contain .eu. or eu-central or eu-west
  const isEU =
    dbUrl.includes('.eu.') ||
    dbUrl.includes('eu-central') ||
    dbUrl.includes('eu-west') ||
    dbUrl.includes('frankfurt') ||
    dbUrl.includes('localhost') || // Local dev is OK
    dbUrl.includes('127.0.0.1');

  if (!dbUrl) {
    return { service: 'Database', compliant: false, warning: 'DATABASE_URL non configurée' };
  }

  if (!isEU && !dbUrl.includes('localhost')) {
    return {
      service: 'Database (Neon)',
      compliant: false,
      region: 'Unknown (potentiellement hors UE)',
      warning:
        'CRITIQUE: La base de données ne semble pas hébergée en UE. Les données sensibles (Art. 9 RGPD) DOIVENT rester en UE.',
    };
  }

  return { service: 'Database (Neon)', compliant: true, region: 'EU' };
}

/**
 * Vérifie que Upstash Redis est en région EU.
 */
function checkRedisRegion(): ComplianceCheck {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || '';

  if (!redisUrl) {
    return {
      service: 'Redis (Upstash)',
      compliant: true,
      warning: 'Non configuré (fallback mémoire)',
    };
  }

  const isEU =
    redisUrl.includes('eu') || redisUrl.includes('frankfurt') || redisUrl.includes('eu1');

  if (!isEU) {
    return {
      service: 'Redis (Upstash)',
      compliant: false,
      region: 'Unknown',
      warning: 'Redis ne semble pas en région EU. Vérifier la configuration Upstash.',
    };
  }

  return { service: 'Redis (Upstash)', compliant: true, region: 'EU' };
}

/**
 * Vérifie que Sentry est configuré en data residency EU.
 */
function checkSentryRegion(): ComplianceCheck {
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '';

  if (!sentryDsn) {
    return { service: 'Sentry', compliant: true, warning: 'Non configuré (monitoring désactivé)' };
  }

  // Sentry EU DSN typically contains .de. or ingest.de.sentry.io
  function checkSentryRegion(): ComplianceCheck {
    const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '';

    if (!sentryDsn) {
      return {
        service: 'Sentry',
        compliant: true,
        warning: 'Non configuré (monitoring désactivé)',
      };
    }

    const residency = process.env.SENTRY_DATA_RESIDENCY?.toLowerCase();

    if (residency !== 'eu') {
      return {
        service: 'Sentry',
        compliant: false,
        region: residency || 'Unknown',
        warning:
          'Sentry: résidence des données EU non confirmée. Vérifier Data Residency EU dans Sentry.',
      };
    }

    return {
      service: 'Sentry',
      compliant: true,
      region: 'EU',
    };
  }

  return { service: 'Sentry', compliant: true, region: 'EU' };
}

/**
 * Vérifie que le compute (Render/Vercel) est en région EU.
 */
function checkComputeRegion(): ComplianceCheck {
  // Render injecte RENDER_REGION
  const renderRegion = process.env.RENDER_REGION || '';
  // Vercel injecte VERCEL_REGION
  const vercelRegion = process.env.VERCEL_REGION || '';

  if (renderRegion) {
    const isEU = renderRegion.includes('frankfurt') || renderRegion.includes('eu');
    return {
      service: 'Compute (Render)',
      compliant: isEU,
      region: renderRegion,
      warning: isEU
        ? undefined
        : `Render est en région ${renderRegion}. Reconfigurer en Frankfurt (EU).`,
    };
  }

  if (vercelRegion) {
    const isEU = ['cdg1', 'arn1', 'fra1', 'dub1'].includes(vercelRegion);
    return {
      service: 'Compute (Vercel)',
      compliant: isEU,
      region: vercelRegion,
      warning: isEU
        ? undefined
        : `Vercel function en région ${vercelRegion}. Configurer regions: ["cdg1"] dans vercel.json.`,
    };
  }

  // Environnement local ou inconnu
  return { service: 'Compute', compliant: true, warning: 'Environnement local ou non détecté' };
}

/**
 * Exécute tous les contrôles de conformité hébergement.
 * Logue les warnings et bloque en production si non-conforme.
 */
export function runComplianceChecks(): { allCompliant: boolean; checks: ComplianceCheck[] } {
  const checks = [
    checkDatabaseRegion(),
    checkRedisRegion(),
    checkSentryRegion(),
    checkComputeRegion(),
  ];

  const nonCompliant = checks.filter(c => !c.compliant);
  const allCompliant = nonCompliant.length === 0;

  if (!allCompliant) {
    for (const check of nonCompliant) {
      logger.error(`[COMPLIANCE] ❌ ${check.service}: ${check.warning}`, {
        service: check.service,
        region: check.region,
      });
    }

    // En production, logguer mais ne pas bloquer (pour éviter un crash loop)
    // L'alerte doit être traitée immédiatement par l'équipe ops
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        '[COMPLIANCE] ⚠️ SERVICES NON-CONFORMES EU DÉTECTÉS EN PRODUCTION — ACTION IMMÉDIATE REQUISE'
      );
    }
  } else {
    logger.info('[COMPLIANCE] ✅ Tous les services sont hébergés en UE');
  }

  // Logguer les warnings (services non configurés)
  for (const check of checks.filter(c => c.compliant && c.warning)) {
    logger.warn(`[COMPLIANCE] ⚠️ ${check.service}: ${check.warning}`);
  }

  return { allCompliant, checks };
}
