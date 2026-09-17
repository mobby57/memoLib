/**
 * IngestionService — point d'entrée UNIQUE du flux entrant (§3.2 de
 * docs/ARCHITECTURE_INGESTION.md).
 *
 * Orchestre les briques existantes en une seule chaîne :
 *
 *   ingest({ source, content, tenantId, senderEmail?, ... })
 *     1. InformationUnitService.create()   -> dédup SHA-256 + unité tracée + classification IA
 *     2. classification (type de dossier détecté, confiance, needsHumanReview)
 *     3. DossierMatcherService.match()      -> dossier cible OU revue humaine
 *     4. renvoie une DÉCISION (ne réalise pas le rattachement en base ici :
 *        le modèle InformationUnit n'a pas de champ dossierId, et on veut une
 *        validation humaine sur les cas incertains — l'appelant persiste selon
 *        sa politique).
 *
 * Invariant : tout ce qui entre devient une InformationUnit (rien n'est perdu),
 * et aucune action automatique n'est prise si la confiance est faible.
 */
import { informationUnitService } from '@/lib/services/information-unit.service';
import { dossierMatcher } from '@/lib/services/dossier-matcher.service';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface IngestInput {
  tenantId: string;
  /** Canal producteur : EMAIL, UPLOAD, API, MANUAL, SCAN, FAX... */
  source: string;
  content: string;
  senderEmail?: string | null;
  detectedClientName?: string | null;
  sourceMetadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  unitId: string;
  duplicate: boolean;
  classification: {
    caseType?: string;
    priority?: string;
    confidence: number;
    method: 'ai' | 'fallback';
    needsHumanReview: boolean;
  };
  dossier: {
    matched: boolean;
    dossierId: string | null;
    clientId: string | null;
    confidence: number;
    needsHumanReview: boolean;
    reason: string;
  };
  /** true si une intervention humaine est requise (classification OU rattachement incertain). */
  needsHumanReview: boolean;
}

export class IngestionService {
  async ingest(input: IngestInput): Promise<IngestResult> {
    // 1. Créer l'unité (dédup + classification IA réelle intégrée).
    const unit = await informationUnitService.create({
      tenantId: input.tenantId,
      source: input.source,
      content: input.content,
      sourceMetadata: input.sourceMetadata,
      metadata: input.metadata,
    });

    const duplicate = Boolean((unit as { __duplicate?: boolean }).__duplicate);

    // 2. Classification (réutilise la même logique IA + fallback).
    const classification = await informationUnitService.classify(input.content, input.tenantId);

    // 3. Rattachement au dossier (déterministe + revue humaine si incertain).
    const match = await dossierMatcher.match({
      tenantId: input.tenantId,
      senderEmail: input.senderEmail,
      detectedClientName: input.detectedClientName,
      detectedTypeDossier: classification.caseType,
    });

    const needsHumanReview = classification.needsHumanReview || match.needsHumanReview;

    // Persistance du rattachement UNIQUEMENT si le match est confiant.
    // Sinon on laisse dossierId null : l'unité part en revue humaine (jamais de
    // rattachement automatique à l'aveugle).
    if (match.matched && !needsHumanReview && match.dossierId) {
      try {
        await prisma.informationUnit.update({
          where: { id: (unit as { id: string }).id },
          data: {
            dossierId: match.dossierId,
            matchConfidence: match.confidence,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        logger.warn('[Ingestion] Échec persistance du rattachement dossier', {
          unitId: (unit as { id: string }).id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('[Ingestion] Flux traité', {
      tenantId: input.tenantId,
      source: input.source,
      unitId: (unit as { id: string }).id,
      caseType: classification.caseType,
      matched: match.matched,
      needsHumanReview,
    });

    return {
      unitId: (unit as { id: string }).id,
      duplicate,
      classification: {
        caseType: classification.caseType,
        priority: classification.priority,
        confidence: classification.confidence,
        method: classification.method,
        needsHumanReview: classification.needsHumanReview,
      },
      dossier: {
        matched: match.matched,
        dossierId: match.dossierId,
        clientId: match.clientId,
        confidence: match.confidence,
        needsHumanReview: match.needsHumanReview,
        reason: match.reason,
      },
      needsHumanReview,
    };
  }
}

export const ingestionService = new IngestionService();
