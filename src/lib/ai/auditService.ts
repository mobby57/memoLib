import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export interface AuditEntry {
  tenantId: string;
  userId?: string;
  entityType: 'email' | 'document' | 'dossier';
  entityId: string;
  decisionType: 'classification' | 'date_extraction' | 'vote' | 'fallback';
  input: any;
  output: any;
  confidence: number;
  source: 'ia' | 'regex' | 'rule' | 'hybrid' | 'human';
}

export class AuditService {
  async logDecision(entry: AuditEntry): Promise<void> {
    const blockchainHash = this.generateBlockchainHash(entry);
    await prisma.aIDecision.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        decisionType: entry.decisionType,
        input: entry.input,
        output: entry.output,
        confidence: entry.confidence,
        source: entry.source,
        blockchainHash,
        humanReviewed: false,
      },
    });
    logger.info('Décision IA enregistrée (hash: ' + blockchainHash.slice(0, 8) + '…)');
  }

  private generateBlockchainHash(entry: AuditEntry): string {
    const data = JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async markReviewed(id: string, userId: string): Promise<void> {
    await prisma.aIDecision.update({
      where: { id },
      data: { humanReviewed: true, reviewedBy: userId, reviewedAt: new Date() },
    });
  }

  async getHistory(entityId: string, entityType: string): Promise<any[]> {
    return prisma.aIDecision.findMany({
      where: { entityId, entityType },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreviewed(tenantId: string): Promise<any[]> {
    return prisma.aIDecision.findMany({
      where: { tenantId, humanReviewed: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getStats(tenantId: string): Promise<any> {
    const [total, unreviewed, avgConfidence] = await Promise.all([
      prisma.aIDecision.count({ where: { tenantId } }),
      prisma.aIDecision.count({ where: { tenantId, humanReviewed: false } }),
      prisma.aIDecision.aggregate({
        where: { tenantId },
        _avg: { confidence: true },
      }),
    ]);
    return { total, unreviewed, avgConfidence: avgConfidence._avg.confidence };
  }

  async exportAudit(entityId: string, entityType: string): Promise<{ json: any; pdf: Buffer }> {
    const entries = await this.getHistory(entityId, entityType);
    const json = { entityId, entityType, entries, exportedAt: new Date().toISOString() };
    const pdf = Buffer.from(JSON.stringify(json, null, 2));
    return { json, pdf };
  }
}

export const auditService = new AuditService();
