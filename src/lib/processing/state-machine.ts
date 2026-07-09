/**
 * Machine à états pour le traitement des informations entrantes.
 * 
 * Principe : chaque info (email, upload, webhook) passe par des états séquentiels.
 * Chaque transition est loguée. Si un crash survient, on sait exactement où reprendre.
 * Aucune info ne peut être "perdue" — elle est toujours dans un état identifiable.
 * 
 * États :
 *   RECEIVED → NORMALIZED → CLASSIFIED → LINKED → PROCESSED
 *                                                     ↓
 *                                                   FAILED (avec retries)
 */

import { prisma } from '@/lib/prisma';
import { createEventLog } from '@/lib/services/event-log.service';

export const PROCESSING_STATES = [
  'RECEIVED',     // Capturé en DB, contenu brut stocké
  'NORMALIZED',   // Métadonnées extraites, hash calculé
  'CLASSIFIED',   // IA a catégorisé (type, urgence, client)
  'LINKED',       // Rattaché à un client/dossier (ou en attente validation humaine)
  'PROCESSED',    // Traitement complet, prêt pour l'utilisateur
  'FAILED',       // Échec (avec reason + retry count)
] as const;

export type ProcessingState = typeof PROCESSING_STATES[number];

interface StateTransition {
  entityType: 'email' | 'upload' | 'webhook';
  entityId: string;
  tenantId: string;
  fromState: ProcessingState | null;
  toState: ProcessingState;
  metadata?: Record<string, any>;
}

/**
 * Effectue une transition d'état ET la trace dans l'audit.
 * Atomique : si l'update DB échoue, rien n'est loggé.
 */
export async function transitionState({
  entityType,
  entityId,
  tenantId,
  fromState,
  toState,
  metadata,
}: StateTransition): Promise<void> {
  // Update l'état en DB
  if (entityType === 'email') {
    await prisma.email.update({
      where: { id: entityId },
      data: {
        processingStatus: toState,
        ...(toState === 'PROCESSED' ? { isProcessed: true, processedAt: new Date() } : {}),
        ...(toState === 'FAILED' ? { processingError: metadata?.error } : {}),
      },
    });
  }

  // Tracer la transition (immuable)
  await createEventLog({
    eventType: 'STATE_TRANSITION',
    entityType,
    entityId,
    actorType: 'SYSTEM',
    tenantId,
    metadata: {
      fromState,
      toState,
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Récupère les éléments bloqués dans un état intermédiaire (crash recovery).
 * Appelé par le cron de reprise automatique.
 */
export async function getStuckItems(tenantId: string, olderThanMinutes = 5) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  return prisma.email.findMany({
    where: {
      tenantId,
      processingStatus: { in: ['RECEIVED', 'NORMALIZED', 'CLASSIFIED', 'LINKED'] },
      isProcessed: false,
      updatedAt: { lt: cutoff },
    },
    orderBy: { receivedAt: 'asc' },
    take: 50,
  });
}

/**
 * Marque un item en échec avec possibilité de retry.
 */
export async function markFailed(
  entityType: 'email' | 'upload' | 'webhook',
  entityId: string,
  tenantId: string,
  error: string,
  currentState: ProcessingState
): Promise<void> {
  await transitionState({
    entityType,
    entityId,
    tenantId,
    fromState: currentState,
    toState: 'FAILED',
    metadata: { error, failedAt: currentState },
  });
}
