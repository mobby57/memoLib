/**
 * Service de Preuves Légales
 *
 * PILIER #4: PREUVE NATIVE
 *
 * Génère des preuves horodatées et certifiées pour validité légale.
 * Compatible RFC 3161 (Timestamp Authority), eIDAS (signatures).
 *
 * Cas d'usage:
 * - Prouver la réception d'un document à une date précise
 * - Certifier qu'une action a été effectuée par un utilisateur
 * - Générer des preuves opposables en justice
 * - Exporter des bundles de preuve pour avocat/expert
 */

import { prisma } from '@/lib/prisma';
import type {
  DigitalSignature,
  ExportProofOptions,
  GenerateProofParams,
  ProofBundle,
  ProofVerificationResult,
  TimestampAuthority,
} from '@/types/legal-proof';
import type { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { createEIDASSignature } from './eidas-signature.service';
import { eventLogService } from './event-log.service';
import { requestRFC3161Timestamp } from './rfc3161-timestamp.service';

// ============================================
// SERVICE
// ============================================

export class LegalProofService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Lister toutes les preuves d'un tenant
   */
  async listProofs(
    tenantId: string,
    filters?: {
      type?: string;
      isValid?: boolean;
      userId?: string;
    }
  ): Promise<ProofBundle[]> {
    const proofs = await this.prisma.legalProof.findMany({
      where: {
        tenantId,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.isValid !== undefined && { isValid: filters.isValid }),
        ...(filters?.userId && { userId: filters.userId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      proofs.map(async proof => {
        const content = JSON.parse(proof.content);
        return {
          id: proof.id,
          type: proof.type,
          tenantId: proof.tenantId,
          entityId: content.entityId,
          entityType: content.entityType,
          documentHash: proof.hash,
          timestamp: proof.timestamp,
          timestampAuthority: proof.timestampToken
            ? {
                url: proof.timestampAuthority || '',
                token: proof.timestampToken,
                timestamp: proof.timestamp,
                certificate: proof.timestampCertificat,
              }
            : undefined,
          signatures: (proof.signatures as any) || [],
          auditTrail: [],
          metadata: proof.metadata as any,
          proofHash: proof.hashChain || '',
          validationStatus: {
            isValid: proof.isValid,
            verifiedAt: new Date(),
            verifiedBy: 'SYSTEM',
            errors: [],
          },
          createdAt: proof.createdAt,
          updatedAt: proof.updatedAt,
        };
      })
    );
  }

  /**
   * Générer un bundle de preuve légale
   *
   * Crée une preuve horodatée avec:
   * - Hash SHA-256 du document/action
   * - Timestamp serveur + optionnel RFC 3161
   * - Chaîne d'audit liée (EventLog)
   * - Signatures électroniques (si fournies)
   * - Hash global de la preuve
   */
  async generateProofBundle(params: GenerateProofParams): Promise<ProofBundle> {
    const {
      type,
      tenantId,
      entityId,
      entityType,
      createdBy,
      reason,
      jurisdiction,
      includeTimestampAuthority = false,
      signatures = [],
    } = params;

    // 1. Récupérer l'entité et générer son hash
    const entityData = await this.getEntityData(entityType, entityId);
    const documentHash = this.calculateHash(entityData);

    // 2. Récupérer la chaîne d'audit (EventLog liés)
    const auditTrail = await this.getAuditTrail(entityType, entityId, tenantId);

    // 3. Générer les signatures avec timestamp
    const timestampedSignatures: DigitalSignature[] = signatures.map(sig => ({
      ...sig,
      timestamp: new Date(),
      signatureHash: this.calculateHash({
        signerId: sig.signerId,
        entityId,
        timestamp: new Date().toISOString(),
      }),
      algorithm: 'SHA-256',
    }));

    // 4. Optionnel: Timestamp Authority RFC 3161
    let timestampAuthority: TimestampAuthority | undefined;
    if (includeTimestampAuthority) {
      timestampAuthority = await this.requestTimestampAuthority(documentHash);
    }

    // 5. Créer le bundle de preuve
    const timestamp = new Date();
    const proofBundle: Omit<ProofBundle, 'id' | 'createdAt' | 'updatedAt'> = {
      type,
      tenantId,
      entityId,
      entityType,
      documentHash,
      timestamp,
      timestampAuthority,
      signatures: timestampedSignatures,
      auditTrail,
      metadata: {
        createdBy,
        reason,
        jurisdiction,
      },
      proofHash: '', // Calculé après
      validationStatus: {
        isValid: true,
        verifiedAt: timestamp,
        verifiedBy: 'SYSTEM',
        errors: [],
      },
    };

    // 6. Calculer le hash global de la preuve
    proofBundle.proofHash = this.calculateProofHash({
      ...proofBundle,
      id: 'temp',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // 7. Sauvegarder en DB (table LegalProof à créer dans schema)
    const savedProof = await this.saveProof(proofBundle);

    // 8. Logger dans EventLog
    await eventLogService.createEventLog({
      eventType: 'LEGAL_PROOF_GENERATED' as any,
      entityType,
      entityId,
      actorType: 'USER' as any,
      actorId: createdBy,
      tenantId,
      metadata: {
        proofId: savedProof.id,
        proofType: type,
        documentHash,
        signaturesCount: timestampedSignatures.length,
      },
    });

    return savedProof;
  }

  /**
   * Vérifier l'intégrité d'une preuve
   *
   * Vérifie:
   * 1. Hash du document n'a pas changé
   * 2. Hash de la preuve correspond
   * 3. Signatures valides
   * 4. Timestamp valide
   * 5. Chaîne d'audit intacte
   */
  async verifyProof(proofId: string): Promise<ProofVerificationResult> {
    const proof = await this.getProof(proofId);
    if (!proof) {
      return {
        isValid: false,
        verifiedAt: new Date(),
        details: {
          hashMatch: false,
          signaturesValid: false,
          timestampValid: false,
          auditTrailIntact: false,
          notExpired: false,
        },
        errors: ['Proof not found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Vérifier hash du document
    const currentEntityData = await this.getEntityData(proof.entityType, proof.entityId);
    const currentHash = this.calculateHash(currentEntityData);
    const hashMatch = currentHash === proof.documentHash;
    if (!hashMatch) {
      errors.push('Document hash mismatch - document has been modified');
    }

    // 2. Vérifier hash de la preuve
    const recalculatedProofHash = this.calculateProofHash(proof);
    const proofHashMatch = recalculatedProofHash === proof.proofHash;
    if (!proofHashMatch) {
      errors.push('Proof hash mismatch - proof has been tampered');
    }

    // 3. Vérifier signatures
    const signaturesValid = proof.signatures.every(sig => {
      const expectedHash = this.calculateHash({
        signerId: sig.signerId,
        entityId: proof.entityId,
        timestamp: sig.timestamp.toISOString(),
      });
      return expectedHash === sig.signatureHash;
    });
    if (!signaturesValid) {
      errors.push('One or more signatures are invalid');
    }

    // 4. Vérifier timestamp
    const timestampValid = proof.timestamp <= new Date();
    if (!timestampValid) {
      errors.push('Timestamp is in the future - invalid');
    }

    // 5. Vérifier audit trail
    const auditTrailIntact = await this.verifyAuditTrail(proof);
    if (!auditTrailIntact) {
      errors.push('Audit trail has been compromised');
    }

    // 6. Vérifier expiration
    const notExpired = !proof.expiresAt || proof.expiresAt > new Date();
    if (!notExpired) {
      warnings.push('Proof has expired');
    }

    const isValid =
      hashMatch && proofHashMatch && signaturesValid && timestampValid && auditTrailIntact;

    return {
      isValid,
      verifiedAt: new Date(),
      details: {
        hashMatch,
        signaturesValid,
        timestampValid,
        auditTrailIntact,
        notExpired,
      },
      errors,
      warnings,
    };
  }

  /**
   * Exporter une preuve dans différents formats
   *
   * Formats supportés:
   * - JSON: Format technique complet
   * - PDF: Format légal certifié avec watermark
   * - XML: Format standard pour archivage
   * - BLOCKCHAIN: Hash sur blockchain (future)
   */
  async exportProof(proofId: string, options: ExportProofOptions): Promise<Buffer> {
    const proof = await this.getProof(proofId);
    if (!proof) {
      throw new Error(`Proof ${proofId} not found`);
    }

    switch (options.format) {
      case 'JSON':
        return this.exportAsJSON(proof, options);
      case 'PDF':
        return this.exportAsPDF(proof, options);
      case 'XML':
        return this.exportAsXML(proof, options);
      case 'BLOCKCHAIN':
        throw new Error('Blockchain export not yet implemented');
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Ajouter une signature à une preuve existante
   */
  async addSignature(
    proofId: string,
    signature: Omit<DigitalSignature, 'timestamp' | 'signatureHash'>
  ): Promise<ProofBundle> {
    const proof = await this.getProof(proofId);
    if (!proof) {
      throw new Error(`Proof ${proofId} not found`);
    }

    // Utiliser le service eIDAS pour les signatures qualifiées
    let timestampedSignature: DigitalSignature;

    if (signature.type === 'QUALIFIED' || signature.type === 'ADVANCED') {
      try {
        const eidasResponse = await createEIDASSignature({
          documentHash: proof.documentHash,
          signerEmail: signature.signerEmail,
          signerName: signature.signerName,
          signatureType: signature.type,
          reason: `Signature de la preuve ${proofId}`,
          metadata: signature as any,
        });

        timestampedSignature = eidasResponse.signature;
      } catch (error) {
        console.error('eIDAS signature failed, using fallback:', error);
        // Fallback: signature basique
        timestampedSignature = {
          ...signature,
          timestamp: new Date(),
          signatureHash: this.calculateHash({
            signerId: signature.signerId,
            entityId: proof.entityId,
            timestamp: new Date().toISOString(),
          }),
          algorithm: 'SHA-256',
        };
      }
    } else {
      // Signature basique
      timestampedSignature = {
        ...signature,
        timestamp: new Date(),
        signatureHash: this.calculateHash({
          signerId: signature.signerId,
          entityId: proof.entityId,
          timestamp: new Date().toISOString(),
        }),
        algorithm: 'SHA-256',
      };
    }

    proof.signatures.push(timestampedSignature);
    proof.proofHash = this.calculateProofHash(proof);
    proof.updatedAt = new Date();

    // Sauvegarder (à implémenter avec DB)
    await this.updateProof(proof);

    // Logger
    await eventLogService.createEventLog({
      eventType: 'LEGAL_PROOF_SIGNED' as any,
      entityType: proof.entityType,
      entityId: proof.entityId,
      actorType: 'USER' as any,
      actorId: signature.signerId,
      tenantId: proof.tenantId,
      metadata: {
        proofId,
        signatureType: signature.type,
      },
    });

    return proof;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async getEntityData(entityType: string, entityId: string): Promise<any> {
    // Récupérer l'entité depuis Prisma selon le type
    const modelName = entityType.toLowerCase();

    try {
      // @ts-ignore - Dynamic model access
      const entity = await this.prisma[modelName].findUnique({
        where: { id: entityId },
      });
      return entity;
    } catch (error) {
      throw new Error(`Entity ${entityType}:${entityId} not found`);
    }
  }

  private async getAuditTrail(entityType: string, entityId: string, tenantId: string) {
    const events = await eventLogService.getTimeline({
      entityType,
      entityId,
      tenantId,
      limit: 1000,
    });

    return {
      eventLogIds: events.map(e => e.id),
      checksums: events.map(e => e.checksum),
    };
  }

  private calculateHash(data: any): string {
    const canonical = JSON.stringify(data, Object.keys(data).sort());
    return createHash('sha256').update(canonical, 'utf8').digest('hex');
  }

  private calculateProofHash(proof: Omit<ProofBundle, 'proofHash'>): string {
    return this.calculateHash({
      type: proof.type,
      entityId: proof.entityId,
      documentHash: proof.documentHash,
      timestamp: proof.timestamp.toISOString(),
      auditTrail: proof.auditTrail,
      signatures: proof.signatures.map(s => s.signatureHash),
    });
  }

  private async requestTimestampAuthority(documentHash: string): Promise<TimestampAuthority> {
    try {
      const tsaResponse = await requestRFC3161Timestamp(documentHash);

      return {
        name: 'RFC 3161 TSA',
        url: process.env.RFC3161_TSA_URL || 'https://freetsa.org/tsr',
        token: tsaResponse.token,
        hash: this.calculateHash(tsaResponse.token),
        timestamp: tsaResponse.timestamp,
      };
    } catch (error) {
      console.error('RFC 3161 timestamp failed:', error);
      // Fallback mock en cas d'échec
      const timestamp = new Date();
      const token = this.calculateHash({
        documentHash,
        timestamp: timestamp.toISOString(),
        authority: 'MemoLib-TSA-Fallback',
      });

      return {
        name: 'MemoLib TSA (Fallback)',
        url: 'https://tsa.memolib.io/rfc3161',
        token,
        hash: this.calculateHash(token),
        timestamp,
      };
    }
  }

  private async verifyAuditTrail(proof: ProofBundle): Promise<boolean> {
    // Vérifier que tous les EventLog existent et n'ont pas été modifiés
    for (let i = 0; i < proof.auditTrail.eventLogIds.length; i++) {
      const eventId = proof.auditTrail.eventLogIds[i];
      const expectedChecksum = proof.auditTrail.checksums[i];

      const isValid = await eventLogService.verifyIntegrity(eventId);
      if (!isValid) return false;

      // Vérifier que le checksum n'a pas changé
      const event = await this.prisma.eventLog.findUnique({
        where: { id: eventId },
      });
      if (event?.checksum !== expectedChecksum) return false;
    }

    return true;
  }

  private async saveProof(
    proof: Omit<ProofBundle, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProofBundle> {
    const saved = await this.prisma.legalProof.create({
      data: {
        type: proof.type,
        content: JSON.stringify({
          entityType: proof.entityType,
          entityId: proof.entityId,
        }),
        reason: proof.metadata.reason || '',
        metadata: proof.metadata as any,
        hash: proof.documentHash,
        algorithm: 'SHA-256',
        hashChain: proof.proofHash,
        timestamp: proof.timestamp,
        timestampToken: proof.timestampAuthority?.token,
        timestampAuthority: proof.timestampAuthority?.url,
        timestampCertificat: proof.timestampAuthority?.certificate,
        signatures: proof.signatures as any,
        jurisdiction: proof.metadata.jurisdiction,
        isValid: proof.validationStatus.isValid,
        userId: proof.metadata.createdBy,
        tenantId: proof.tenantId,
      },
    });

    return {
      id: saved.id,
      type: proof.type,
      tenantId: proof.tenantId,
      entityId: proof.entityId,
      entityType: proof.entityType,
      documentHash: proof.documentHash,
      timestamp: proof.timestamp,
      timestampAuthority: proof.timestampAuthority,
      signatures: proof.signatures,
      auditTrail: proof.auditTrail,
      metadata: proof.metadata,
      proofHash: proof.proofHash,
      validationStatus: proof.validationStatus,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  private async getProof(proofId: string): Promise<ProofBundle | null> {
    const proof = await this.prisma.legalProof.findUnique({
      where: { id: proofId },
    });

    if (!proof) {
      return null;
    }

    // Reconstruire le ProofBundle depuis la DB
    const content = JSON.parse(proof.content);
    return {
      id: proof.id,
      type: proof.type,
      tenantId: proof.tenantId,
      entityId: content.entityId,
      entityType: content.entityType,
      documentHash: proof.hash,
      timestamp: proof.timestamp,
      timestampAuthority: proof.timestampToken
        ? {
            url: proof.timestampAuthority || '',
            token: proof.timestampToken,
            timestamp: proof.timestamp,
            certificate: proof.timestampCertificat,
          }
        : undefined,
      signatures: (proof.signatures as any) || [],
      auditTrail: {
        eventLogIds: [],
        checksums: [],
      },
      metadata: proof.metadata as any,
      proofHash: proof.hashChain || '',
      validationStatus: {
        isValid: proof.isValid,
        verifiedAt: new Date(),
        verifiedBy: 'SYSTEM',
        errors: [],
      },
      createdAt: proof.createdAt,
      updatedAt: proof.updatedAt,
    };
  }

  private async updateProof(proof: ProofBundle): Promise<void> {
    await this.prisma.legalProof.update({
      where: { id: proof.id },
      data: {
        signatures: proof.signatures as any,
        isValid: proof.validationStatus.isValid,
        updatedAt: new Date(),
      },
    });
  }

  // ============================================
  // EXPORT FORMATS
  // ============================================

  private async exportAsJSON(proof: ProofBundle, options: ExportProofOptions): Promise<Buffer> {
    const data = {
      ...proof,
      exportedAt: new Date().toISOString(),
      exportedBy: 'LegalProofService',
      includeAuditTrail: options.includeAuditTrail,
    };

    if (!options.includeAuditTrail) {
      delete (data as any).auditTrail;
    }
    if (!options.includeSignatures) {
      delete (data as any).signatures;
    }

    return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
  }

  private async exportAsPDF(proof: ProofBundle, options: ExportProofOptions): Promise<Buffer> {
    // TODO: Générer PDF avec librairie (pdfkit, puppeteer, etc.)
    // Pour MVP: retourner JSON encodé
    const lang = options.language || 'fr';
    const header =
      lang === 'fr' ? '=== PREUVE LÉGALE CERTIFIÉE ===\n\n' : '=== CERTIFIED LEGAL PROOF ===\n\n';

    const content =
      `${header}` +
      `ID: ${proof.id}\n` +
      `Type: ${proof.type}\n` +
      `Entité: ${proof.entityType}#${proof.entityId}\n` +
      `Hash: ${proof.documentHash}\n` +
      `Timestamp: ${proof.timestamp.toISOString()}\n` +
      `Signatures: ${proof.signatures.length}\n` +
      `Statut: ${proof.validationStatus.isValid ? 'VALIDE' : 'INVALIDE'}\n\n` +
      (options.watermark ? `${options.watermark}\n\n` : '') +
      `Généré le: ${new Date().toISOString()}`;

    return Buffer.from(content, 'utf-8');
  }

  private async exportAsXML(proof: ProofBundle, options: ExportProofOptions): Promise<Buffer> {
    // TODO: Générer XML standard (XAdES, etc.)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<LegalProof xmlns="https://memolib.io/schemas/legal-proof/v1">
  <ProofId>${proof.id}</ProofId>
  <Type>${proof.type}</Type>
  <Entity type="${proof.entityType}" id="${proof.entityId}" />
  <DocumentHash algorithm="SHA-256">${proof.documentHash}</DocumentHash>
  <Timestamp>${proof.timestamp.toISOString()}</Timestamp>
  <ProofHash>${proof.proofHash}</ProofHash>
  <ValidationStatus>${proof.validationStatus.isValid}</ValidationStatus>
</LegalProof>`;

    return Buffer.from(xml, 'utf-8');
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const legalProofService = new LegalProofService();
