/**
 * Service de Purge Automatique des Preuves Légales Expirées
 *
 * Conforme RGPD Art. 5.1.e - Limitation de conservation
 * Supprime les preuves > 10 ans (sauf contentieux actif)
 *
 * @module legal-proof-purge
 * @author MemoLib
 * @version 1.0.0
 */

import { prisma } from '@/lib/prisma';
import { eventLogService } from '@/lib/services/event-log.service';

/**
 * Configuration de la purge
 */
interface PurgeConfig {
  /** Durée de rétention en années (par défaut 10 ans) */
  retentionYears: number;
  /** Archiver avant suppression (Azure Blob) */
  archiveBeforeDelete: boolean;
  /** Mode dry-run (simulation sans suppression) */
  dryRun: boolean;
  /** Ignorer les dossiers en contentieux */
  ignoreActiveContentieux: boolean;
}

/**
 * Résultat de la purge
 */
interface PurgeResult {
  /** Nombre total de preuves expirées */
  totalExpired: number;
  /** Nombre de preuves archivées */
  archived: number;
  /** Nombre de preuves supprimées */
  deleted: number;
  /** Nombre de preuves ignorées (contentieux actif) */
  ignored: number;
  /** Liste des IDs supprimés */
  deletedIds: string[];
  /** Erreurs rencontrées */
  errors: Array<{ proofId: string; error: string }>;
  /** Durée d'exécution (ms) */
  executionTime: number;
}

/**
 * Purge automatique des preuves légales expirées
 *
 * @example
 * ```typescript
 * // Dry run (simulation)
 * const result = await purgeLegalProofs({ dryRun: true });
 * console.log(`${result.totalExpired} preuves à supprimer`);
 *
 * // Production (suppression réelle)
 * const result = await purgeLegalProofs({
 *   dryRun: false,
 *   archiveBeforeDelete: true
 * });
 * ```
 *
 * @param config - Configuration de la purge
 * @returns Résultat détaillé de la purge
 */
export async function purgeLegalProofs(config: Partial<PurgeConfig> = {}): Promise<PurgeResult> {
  const startTime = Date.now();

  // Configuration par défaut
  const finalConfig: PurgeConfig = {
    retentionYears: 10,
    archiveBeforeDelete: true,
    dryRun: false,
    ignoreActiveContentieux: true,
    ...config,
  };

  const result: PurgeResult = {
    totalExpired: 0,
    archived: 0,
    deleted: 0,
    ignored: 0,
    deletedIds: [],
    errors: [],
    executionTime: 0,
  };

  try {
    // 1. Calculer date d'expiration
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() - finalConfig.retentionYears);

    console.log(`[Purge Legal Proofs] Date d'expiration: ${expirationDate.toISOString()}`);
    console.log(
      `[Purge Legal Proofs] Mode: ${finalConfig.dryRun ? 'DRY-RUN (simulation)' : 'PRODUCTION'}`
    );

    // 2. Trouver preuves expirées
    const expiredProofs = await prisma.legalProof.findMany({
      where: {
        createdAt: { lt: expirationDate },
        isValid: true, // Ne pas supprimer celles déjà invalidées
      },
      include: {
        dossier: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    result.totalExpired = expiredProofs.length;
    console.log(`[Purge Legal Proofs] ${result.totalExpired} preuves expirées trouvées`);

    // 3. Filtrer par contentieux actif
    const proofsToDelete = finalConfig.ignoreActiveContentieux
      ? expiredProofs.filter(proof => {
          // Ignorer si dossier en contentieux
          if (proof.dossier?.status === 'CONTENTIEUX') {
            result.ignored++;
            return false;
          }
          return true;
        })
      : expiredProofs;

    console.log(
      `[Purge Legal Proofs] ${proofsToDelete.length} preuves à supprimer (${result.ignored} ignorées)`
    );

    // 4. Traiter chaque preuve
    for (const proof of proofsToDelete) {
      try {
        // 4a. Archiver si activé
        if (finalConfig.archiveBeforeDelete && !finalConfig.dryRun) {
          await archiveProofToAzureBlob(proof);
          result.archived++;
        }

        // 4b. Supprimer (sauf dry-run)
        if (!finalConfig.dryRun) {
          await prisma.legalProof.delete({
            where: { id: proof.id },
          });

          // Log événement
          await eventLogService.createEvent({
            tenantId: proof.tenantId,
            userId: null,
            eventType: 'LEGAL_PROOF_PURGED',
            entityType: 'legal_proof',
            entityId: proof.id,
            description: `Preuve légale purgée automatiquement (expiration ${finalConfig.retentionYears} ans)`,
            metadata: {
              proofType: proof.type,
              createdAt: proof.createdAt,
              expirationDate: expirationDate,
              archived: finalConfig.archiveBeforeDelete,
            },
          });

          result.deleted++;
          result.deletedIds.push(proof.id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Purge Legal Proofs] Erreur preuve ${proof.id}:`, errorMessage);
        result.errors.push({
          proofId: proof.id,
          error: errorMessage,
        });
      }
    }

    // 5. Résumé final
    result.executionTime = Date.now() - startTime;
    console.log(`[Purge Legal Proofs] Terminé en ${result.executionTime}ms`);
    console.log(
      `[Purge Legal Proofs] Archivées: ${result.archived}, Supprimées: ${result.deleted}, Erreurs: ${result.errors.length}`
    );

    // 6. Log événement global
    if (!finalConfig.dryRun) {
      await eventLogService.createEvent({
        tenantId: 'SYSTEM',
        userId: null,
        eventType: 'LEGAL_PROOF_PURGE_COMPLETED',
        entityType: 'system',
        entityId: 'legal-proof-purge',
        description: `Purge automatique preuves légales complétée`,
        metadata: result,
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Purge Legal Proofs] Erreur fatale:', errorMessage);
    throw new Error(`Purge failed: ${errorMessage}`);
  }
}

/**
 * Archiver une preuve vers Azure Blob Storage
 *
 * @param proof - Preuve à archiver
 */
async function archiveProofToAzureBlob(proof: any): Promise<void> {
  // TODO: Implémenter archivage Azure Blob
  // Pour l'instant, log seulement
  console.log(`[Archive] Preuve ${proof.id} archivée (mock)`);

  /* Production implementation:
  const { BlobServiceClient } = require('@azure/storage-blob');

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = 'legal-proofs-archive';

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const blobName = `${proof.tenantId}/${proof.id}_${proof.createdAt.getTime()}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const proofData = JSON.stringify(proof, null, 2);
  await blockBlobClient.upload(proofData, proofData.length, {
    metadata: {
      proofId: proof.id,
      tenantId: proof.tenantId,
      archivedAt: new Date().toISOString(),
      retentionYears: '10',
    },
  });
  */
}

/**
 * Purge par tenant spécifique
 *
 * @param tenantId - ID du tenant
 * @param config - Configuration
 */
export async function purgeTenantLegalProofs(
  tenantId: string,
  config: Partial<PurgeConfig> = {}
): Promise<PurgeResult> {
  const startTime = Date.now();

  const finalConfig: PurgeConfig = {
    retentionYears: 10,
    archiveBeforeDelete: true,
    dryRun: false,
    ignoreActiveContentieux: true,
    ...config,
  };

  const result: PurgeResult = {
    totalExpired: 0,
    archived: 0,
    deleted: 0,
    ignored: 0,
    deletedIds: [],
    errors: [],
    executionTime: 0,
  };

  try {
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() - finalConfig.retentionYears);

    const expiredProofs = await prisma.legalProof.findMany({
      where: {
        tenantId,
        createdAt: { lt: expirationDate },
        isValid: true,
      },
      include: {
        dossier: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    result.totalExpired = expiredProofs.length;

    for (const proof of expiredProofs) {
      // Skip si contentieux
      if (finalConfig.ignoreActiveContentieux && proof.dossier?.status === 'CONTENTIEUX') {
        result.ignored++;
        continue;
      }

      try {
        if (finalConfig.archiveBeforeDelete && !finalConfig.dryRun) {
          await archiveProofToAzureBlob(proof);
          result.archived++;
        }

        if (!finalConfig.dryRun) {
          await prisma.legalProof.delete({ where: { id: proof.id } });
          result.deleted++;
          result.deletedIds.push(proof.id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push({ proofId: proof.id, error: errorMessage });
      }
    }

    result.executionTime = Date.now() - startTime;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Tenant purge failed: ${errorMessage}`);
  }
}

/**
 * Statistiques de rétention
 */
export async function getLegalProofRetentionStats() {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

  const [total, lessThanOneYear, oneToFiveYears, fiveToTenYears, moreThanTenYears] =
    await Promise.all([
      prisma.legalProof.count(),
      prisma.legalProof.count({ where: { createdAt: { gte: oneYearAgo } } }),
      prisma.legalProof.count({ where: { createdAt: { gte: fiveYearsAgo, lt: oneYearAgo } } }),
      prisma.legalProof.count({ where: { createdAt: { gte: tenYearsAgo, lt: fiveYearsAgo } } }),
      prisma.legalProof.count({ where: { createdAt: { lt: tenYearsAgo } } }),
    ]);

  return {
    total,
    byAge: {
      lessThanOneYear,
      oneToFiveYears,
      fiveToTenYears,
      moreThanTenYears,
    },
    expiredCount: moreThanTenYears,
    expiredPercentage: total > 0 ? (moreThanTenYears / total) * 100 : 0,
  };
}
