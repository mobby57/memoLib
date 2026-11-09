/**
 * Service de partage sécurisé de documents — Avocat → Client
 * 
 * Fonctionnalités :
 * 1. L'avocat partage un document/information à son client
 * 2. Chaque partage est tracé (EventLog immuable)
 * 3. La consultation par le client est tracée (preuve de notification)
 * 4. Le client peut signer/accuser réception (signature simple horodatée)
 * 5. Tout est exportable comme preuve pour audience
 * 
 * Valeur légale :
 * - Horodatage serveur (pas client)
 * - Hash SHA-256 du document au moment du partage
 * - Chaîne d'événements immuable
 * - Preuve de consultation (IP, user-agent, date)
 */

import { prisma } from '@/lib/prisma';
import { createHash, randomUUID } from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ShareDocumentInput {
  tenantId: string;
  documentId?: string;
  dossierId: string;
  clientUserId: string;  // User ID du client (rôle CLIENT)
  sharedByUserId: string; // User ID de l'avocat
  title: string;
  message?: string; // Message accompagnant le partage
  requiresAcknowledgment: boolean; // Le client doit accuser réception
  requiresSignature: boolean; // Le client doit signer
  expiresAt?: Date; // Lien expire après cette date
  confidentialityLevel: 'standard' | 'confidentiel' | 'secret_professionnel';
}

export interface ClientShare {
  id: string;
  tenantId: string;
  dossierId: string;
  documentId: string | null;
  clientUserId: string;
  sharedByUserId: string;
  title: string;
  message: string | null;
  accessToken: string; // Token unique pour accès direct
  documentHash: string | null; // SHA-256 du document au moment du partage
  confidentialityLevel: string;
  requiresAcknowledgment: boolean;
  requiresSignature: boolean;
  status: ShareStatus;
  sharedAt: Date;
  firstViewedAt: Date | null;
  viewCount: number;
  acknowledgedAt: Date | null;
  signedAt: Date | null;
  signatureHash: string | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  revokeReason: string | null;
}

export type ShareStatus = 
  | 'SHARED'        // Partagé, pas encore vu
  | 'VIEWED'        // Le client l'a ouvert
  | 'ACKNOWLEDGED'  // Le client a accusé réception
  | 'SIGNED'        // Le client a signé
  | 'EXPIRED'       // Lien expiré
  | 'REVOKED';      // Révoqué par l'avocat

export interface ViewEvent {
  shareId: string;
  viewedAt: Date;
  ipAddress: string;
  userAgent: string;
  clientUserId: string;
}

export interface SignatureData {
  shareId: string;
  signedAt: Date;
  signedByUserId: string;
  signedByName: string;
  signedByEmail: string;
  ipAddress: string;
  userAgent: string;
  consentText: string; // Texte de consentement accepté
}

// ─── Service principal ──────────────────────────────────────────────────────────

export class ClientShareService {
  
  /**
   * Partager un document avec un client.
   * Crée un enregistrement de partage + EventLog + Notification.
   */
  async shareDocument(input: ShareDocumentInput): Promise<ClientShare> {
    const shareId = randomUUID();
    const accessToken = this.generateAccessToken();
    const sharedAt = new Date();

    // Calculer le hash du document si fourni
    let documentHash: string | null = null;
    if (input.documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: input.documentId, tenantId: input.tenantId },
      });
      if (doc?.sha256) {
        documentHash = doc.sha256;
      }
    }

    // Créer le partage via raw SQL (la table sera créée par migration)
    // Pour l'instant, on utilise le modèle existant Notification + metadata
    const notification = await prisma.notification.create({
      data: {
        id: shareId,
        userId: input.clientUserId,
        type: 'DOCUMENT_SHARED',
        title: input.title,
        message: input.message || `Un document a été partagé avec vous dans le cadre de votre dossier.`,
        priority: input.requiresSignature ? 'high' : 'normal',
        data: JSON.stringify({
          shareType: 'client_share',
          tenantId: input.tenantId,
          dossierId: input.dossierId,
          documentId: input.documentId,
          sharedByUserId: input.sharedByUserId,
          accessToken,
          documentHash,
          confidentialityLevel: input.confidentialityLevel,
          requiresAcknowledgment: input.requiresAcknowledgment,
          requiresSignature: input.requiresSignature,
          status: 'SHARED',
          sharedAt: sharedAt.toISOString(),
          expiresAt: input.expiresAt?.toISOString() || null,
          viewEvents: [],
          acknowledgedAt: null,
          signedAt: null,
          signatureData: null,
        }),
      },
    });

    // Créer l'EventLog (audit trail immuable)
    await this.createAuditLog(input.tenantId, input.sharedByUserId, {
      action: 'DOCUMENT_SHARED_TO_CLIENT',
      entityType: 'document_share',
      entityId: shareId,
      details: {
        documentId: input.documentId,
        dossierId: input.dossierId,
        clientUserId: input.clientUserId,
        title: input.title,
        documentHash,
        confidentialityLevel: input.confidentialityLevel,
        requiresAcknowledgment: input.requiresAcknowledgment,
        requiresSignature: input.requiresSignature,
      },
    });

    // Horodatage certifié RFC 3161 (preuve tierce de la date de partage)
    try {
      const { certifyClientShare } = await import('@/lib/services/certified-timestamp');
      await certifyClientShare({
        tenantId: input.tenantId,
        userId: input.sharedByUserId,
        shareId,
        documentHash: documentHash || shareId,
      });
    } catch {
      // Non bloquant
    }

    return {
      id: shareId,
      tenantId: input.tenantId,
      dossierId: input.dossierId,
      documentId: input.documentId || null,
      clientUserId: input.clientUserId,
      sharedByUserId: input.sharedByUserId,
      title: input.title,
      message: input.message || null,
      accessToken,
      documentHash,
      confidentialityLevel: input.confidentialityLevel,
      requiresAcknowledgment: input.requiresAcknowledgment,
      requiresSignature: input.requiresSignature,
      status: 'SHARED',
      sharedAt,
      firstViewedAt: null,
      viewCount: 0,
      acknowledgedAt: null,
      signedAt: null,
      signatureHash: null,
      expiresAt: input.expiresAt || null,
      revokedAt: null,
      revokedBy: null,
      revokeReason: null,
    };
  }

  /**
   * Enregistrer la consultation d'un document partagé.
   * Crée une preuve de consultation avec IP, date, user-agent.
   */
  async recordView(event: ViewEvent): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: event.shareId },
    });
    if (!notification?.data) return;

    const data = JSON.parse(notification.data);
    if (data.shareType !== 'client_share') return;
    if (data.status === 'REVOKED' || data.status === 'EXPIRED') return;

    // Mettre à jour les données
    const viewEvents = data.viewEvents || [];
    viewEvents.push({
      viewedAt: event.viewedAt.toISOString(),
      ipAddress: this.hashIP(event.ipAddress), // Minimisation RGPD
      userAgent: event.userAgent.slice(0, 200),
    });

    const isFirstView = !data.firstViewedAt;
    const updatedData = {
      ...data,
      status: data.status === 'SHARED' ? 'VIEWED' : data.status,
      firstViewedAt: data.firstViewedAt || event.viewedAt.toISOString(),
      viewCount: (data.viewCount || 0) + 1,
      viewEvents,
    };

    await prisma.notification.update({
      where: { id: event.shareId },
      data: { data: JSON.stringify(updatedData) },
    });

    // EventLog pour la première consultation
    if (isFirstView) {
      await this.createAuditLog(data.tenantId, event.clientUserId, {
        action: 'CLIENT_VIEWED_SHARED_DOCUMENT',
        entityType: 'document_share',
        entityId: event.shareId,
        details: {
          documentId: data.documentId,
          dossierId: data.dossierId,
          firstViewedAt: event.viewedAt.toISOString(),
          ipHash: this.hashIP(event.ipAddress),
        },
      });
    }
  }

  /**
   * Client accuse réception d'un document partagé.
   */
  async acknowledge(shareId: string, clientUserId: string, ipAddress: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: shareId },
    });
    if (!notification?.data) throw new Error('Share not found');

    const data = JSON.parse(notification.data);
    if (data.clientUserId !== clientUserId) throw new Error('Unauthorized');
    if (data.status === 'REVOKED') throw new Error('Share revoked');
    if (data.acknowledgedAt) throw new Error('Already acknowledged');

    const acknowledgedAt = new Date();
    const updatedData = {
      ...data,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: acknowledgedAt.toISOString(),
    };

    await prisma.notification.update({
      where: { id: shareId },
      data: { 
        data: JSON.stringify(updatedData),
        isRead: true,
        readAt: acknowledgedAt,
      },
    });

    await this.createAuditLog(data.tenantId, clientUserId, {
      action: 'CLIENT_ACKNOWLEDGED_DOCUMENT',
      entityType: 'document_share',
      entityId: shareId,
      details: {
        documentId: data.documentId,
        dossierId: data.dossierId,
        acknowledgedAt: acknowledgedAt.toISOString(),
        ipHash: this.hashIP(ipAddress),
      },
    });
  }

  /**
   * Client signe un document partagé (signature simple horodatée).
   * La signature est un hash du contenu + identité + timestamp.
   */
  async sign(shareId: string, signatureInput: SignatureData): Promise<string> {
    const notification = await prisma.notification.findUnique({
      where: { id: shareId },
    });
    if (!notification?.data) throw new Error('Share not found');

    const data = JSON.parse(notification.data);
    if (data.clientUserId !== signatureInput.signedByUserId) throw new Error('Unauthorized');
    if (data.status === 'REVOKED') throw new Error('Share revoked');
    if (data.signedAt) throw new Error('Already signed');
    if (!data.requiresSignature) throw new Error('Signature not required');

    // Construire le hash de signature
    const signaturePayload = [
      shareId,
      data.documentHash || 'no-document',
      signatureInput.signedByUserId,
      signatureInput.signedByName,
      signatureInput.signedByEmail,
      signatureInput.consentText,
      signatureInput.signedAt.toISOString(),
    ].join('|');

    const signatureHash = createHash('sha256').update(signaturePayload).digest('hex');

    const updatedData = {
      ...data,
      status: 'SIGNED',
      signedAt: signatureInput.signedAt.toISOString(),
      signatureData: {
        signedByName: signatureInput.signedByName,
        signedByEmail: signatureInput.signedByEmail,
        consentText: signatureInput.consentText,
        signatureHash,
        ipHash: this.hashIP(signatureInput.ipAddress),
        userAgent: signatureInput.userAgent.slice(0, 200),
      },
    };

    await prisma.notification.update({
      where: { id: shareId },
      data: { data: JSON.stringify(updatedData) },
    });

    await this.createAuditLog(data.tenantId, signatureInput.signedByUserId, {
      action: 'CLIENT_SIGNED_DOCUMENT',
      entityType: 'document_share',
      entityId: shareId,
      details: {
        documentId: data.documentId,
        dossierId: data.dossierId,
        signedAt: signatureInput.signedAt.toISOString(),
        signatureHash,
        consentText: signatureInput.consentText,
        ipHash: this.hashIP(signatureInput.ipAddress),
      },
    });

    // Horodatage certifié RFC 3161 (preuve tierce de la date de signature)
    try {
      const { certifyClientSignature } = await import('@/lib/services/certified-timestamp');
      await certifyClientSignature({
        tenantId: data.tenantId,
        userId: signatureInput.signedByUserId,
        shareId,
        signatureHash,
      });
    } catch {
      // Non bloquant
    }

    return signatureHash;
  }

  /**
   * Révoquer un partage (l'avocat retire l'accès au client).
   */
  async revoke(shareId: string, revokedByUserId: string, reason: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: shareId },
    });
    if (!notification?.data) throw new Error('Share not found');

    const data = JSON.parse(notification.data);
    const revokedAt = new Date();

    const updatedData = {
      ...data,
      status: 'REVOKED',
      revokedAt: revokedAt.toISOString(),
      revokedBy: revokedByUserId,
      revokeReason: reason,
    };

    await prisma.notification.update({
      where: { id: shareId },
      data: { data: JSON.stringify(updatedData) },
    });

    await this.createAuditLog(data.tenantId, revokedByUserId, {
      action: 'DOCUMENT_SHARE_REVOKED',
      entityType: 'document_share',
      entityId: shareId,
      details: {
        documentId: data.documentId,
        dossierId: data.dossierId,
        reason,
        revokedAt: revokedAt.toISOString(),
      },
    });
  }

  /**
   * Lister les partages d'un dossier (vue avocat).
   */
  async listByDossier(tenantId: string, dossierId: string): Promise<ClientShare[]> {
    const notifications = await prisma.notification.findMany({
      where: { type: 'DOCUMENT_SHARED' },
      orderBy: { createdAt: 'desc' },
    });

    return notifications
      .filter((n) => {
        if (!n.data) return false;
        const data = JSON.parse(n.data);
        return data.shareType === 'client_share' && data.tenantId === tenantId && data.dossierId === dossierId;
      })
      .map((n) => this.notificationToShare(n));
  }

  /**
   * Lister les partages pour un client (vue client — portail).
   */
  async listForClient(clientUserId: string): Promise<ClientShare[]> {
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: clientUserId,
        type: 'DOCUMENT_SHARED',
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications
      .filter((n) => {
        if (!n.data) return false;
        const data = JSON.parse(n.data);
        return data.shareType === 'client_share' && data.status !== 'REVOKED';
      })
      .map((n) => this.notificationToShare(n));
  }

  /**
   * Générer un bundle de preuve exportable (pour audience).
   * Contient : le document, la chaîne d'événements, les signatures.
   */
  async exportProofBundle(shareId: string, tenantId: string): Promise<ProofBundle> {
    const notification = await prisma.notification.findUnique({
      where: { id: shareId },
    });
    if (!notification?.data) throw new Error('Share not found');

    const data = JSON.parse(notification.data);
    if (data.tenantId !== tenantId) throw new Error('Unauthorized');

    // Récupérer les AuditLogs liés
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityId: shareId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      shareId,
      title: notification.title,
      documentHash: data.documentHash,
      sharedAt: data.sharedAt,
      sharedBy: data.sharedByUserId,
      clientUserId: data.clientUserId,
      status: data.status,
      confidentialityLevel: data.confidentialityLevel,
      timeline: auditLogs.map((log) => ({
        action: log.action,
        timestamp: log.createdAt.toISOString(),
        userId: log.userId,
        details: log.details ? JSON.parse(log.details as string) : null,
      })),
      viewEvents: data.viewEvents || [],
      acknowledgedAt: data.acknowledgedAt,
      signatureData: data.signatureData,
      exportedAt: new Date().toISOString(),
      exportHash: createHash('sha256')
        .update(JSON.stringify({ shareId, data, auditLogs: auditLogs.map(l => l.id) }))
        .digest('hex'),
    };
  }

  // ─── Helpers privés ─────────────────────────────────────────────────────────

  private generateAccessToken(): string {
    return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  }

  private hashIP(ip: string): string {
    // RGPD : on ne stocke pas l'IP en clair, juste un hash pour prouver la cohérence
    return createHash('sha256').update(ip + 'memolib-salt').digest('hex').slice(0, 16);
  }

  private notificationToShare(n: any): ClientShare {
    const data = JSON.parse(n.data);
    return {
      id: n.id,
      tenantId: data.tenantId,
      dossierId: data.dossierId,
      documentId: data.documentId,
      clientUserId: n.userId,
      sharedByUserId: data.sharedByUserId,
      title: n.title,
      message: n.message,
      accessToken: data.accessToken,
      documentHash: data.documentHash,
      confidentialityLevel: data.confidentialityLevel,
      requiresAcknowledgment: data.requiresAcknowledgment,
      requiresSignature: data.requiresSignature,
      status: data.status,
      sharedAt: new Date(data.sharedAt),
      firstViewedAt: data.firstViewedAt ? new Date(data.firstViewedAt) : null,
      viewCount: data.viewCount || 0,
      acknowledgedAt: data.acknowledgedAt ? new Date(data.acknowledgedAt) : null,
      signedAt: data.signedAt ? new Date(data.signedAt) : null,
      signatureHash: data.signatureData?.signatureHash || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      revokedAt: data.revokedAt ? new Date(data.revokedAt) : null,
      revokedBy: data.revokedBy,
      revokeReason: data.revokeReason,
    };
  }

  private async createAuditLog(tenantId: string, userId: string, params: {
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, any>;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId,
          userId,
          userEmail: '', // Sera enrichi par le middleware
          userRole: '',
          action: params.action as any,
          entityType: params.entityType,
          entityId: params.entityId,
          details: JSON.stringify(params.details),
          ipAddress: '',
          createdAt: new Date(),
        },
      });
    } catch {
      // Si AuditLog échoue (ex: type action non enum), on log quand même
      console.error(`[ClientShareService] Failed to create AuditLog: ${params.action}`);
    }
  }
}

// ─── Types d'export ─────────────────────────────────────────────────────────────

export interface ProofBundle {
  shareId: string;
  title: string;
  documentHash: string | null;
  sharedAt: string;
  sharedBy: string;
  clientUserId: string;
  status: string;
  confidentialityLevel: string;
  timeline: {
    action: string;
    timestamp: string;
    userId: string;
    details: any;
  }[];
  viewEvents: {
    viewedAt: string;
    ipHash: string;
    userAgent: string;
  }[];
  acknowledgedAt: string | null;
  signatureData: any;
  exportedAt: string;
  exportHash: string;
}

// ─── Singleton ──────────────────────────────────────────────────────────────────

export const clientShareService = new ClientShareService();
