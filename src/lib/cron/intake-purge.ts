/**
 * Purge automatique des demandes d'intake expirées (rétention).
 *
 * Conforme RGPD Art. 5.1.e — limitation de conservation.
 * Supprime les demandes d'intake (et leurs pièces chiffrées) dont la dernière
 * mise à jour dépasse la durée de rétention, en s'appuyant sur la purge
 * unitaire du service intake (storage + DB + audit).
 *
 * @module intake-purge
 */

import { prisma } from '@/lib/prisma';
import { purgeIntakeRequest } from '@/lib/services/intake.service';

export interface IntakePurgeConfig {
  /** Durée de rétention en jours (par défaut 365). */
  retentionDays: number;
  /** Ne purge que les demandes dans ces statuts (par défaut COMPLETE). */
  statuses: string[];
  /** Simulation sans suppression. */
  dryRun: boolean;
}

export interface IntakePurgeRunResult {
  scanned: number;
  purgedRequests: number;
  purgedFiles: number;
  dryRun: boolean;
  cutoff: string;
}

const DEFAULT_CONFIG: IntakePurgeConfig = {
  retentionDays: 365,
  statuses: ['COMPLETE'],
  dryRun: false,
};

/**
 * Exécute la purge des demandes d'intake expirées, tous tenants confondus (ou
 * un tenant si `tenantId` fourni).
 */
export async function runIntakePurge(
  options: Partial<IntakePurgeConfig> & { tenantId?: string } = {}
): Promise<IntakePurgeRunResult> {
  const config = { ...DEFAULT_CONFIG, ...options };
  const cutoff = new Date(Date.now() - config.retentionDays * 24 * 60 * 60 * 1000);

  const expired = await prisma.intakeRequest.findMany({
    where: {
      updatedAt: { lt: cutoff },
      status: { in: config.statuses },
      ...(options.tenantId ? { tenantId: options.tenantId } : {}),
    },
    select: { id: true, tenantId: true },
    take: 1000,
  });

  let purgedRequests = 0;
  let purgedFiles = 0;

  if (!config.dryRun) {
    for (const row of expired) {
      const result = await purgeIntakeRequest(row.tenantId, row.id, 'system:cron-intake-purge');
      purgedRequests += result.purgedRequests;
      purgedFiles += result.purgedFiles;
    }
  }

  return {
    scanned: expired.length,
    purgedRequests,
    purgedFiles,
    dryRun: config.dryRun,
    cutoff: cutoff.toISOString(),
  };
}
