import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

interface UsageRecord {
  tenantId: string;
  type: 'ocr' | 'signature' | 'sms' | 'ai';
  quantity: number;
  metadata?: Record<string, unknown>;
}

const UNIT_COST: Record<UsageRecord['type'], number> = {
  ocr: 0.02,
  signature: 0.5,
  sms: 0.08,
  ai: 0.01,
};

export async function recordUsage(record: UsageRecord): Promise<void> {
  const unitCost = UNIT_COST[record.type] ?? 0;
  const totalCost = Math.round(unitCost * record.quantity * 100) / 100;
  const metadata = record.metadata ? JSON.stringify(record.metadata) : null;

  try {
    await prisma.usageRecord.create({
      data: {
        tenantId: record.tenantId,
        type: record.type,
        quantity: record.quantity,
        unitCost,
        totalCost,
        metadata,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    logger.warn('[BILLING] Could not write usage record', { error: error instanceof Error ? error.message : error });
  }
}

export async function getMonthlyUsage(tenantId: string) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const rows: any[] = await prisma.usageRecord.groupBy({
      by: ['type'],
      where: {
        tenantId,
        createdAt: { gte: start, lt: end },
      },
      _sum: { quantity: true, totalCost: true },
    });

    const byType: Record<string, { quantity: number; cost: number }> = {};
    let totalCost = 0;
    for (const r of rows) {
      const type = r.type as string;
      const qty = r._sum?.quantity ?? 0;
      const cost = r._sum?.totalCost ?? 0;
      byType[type] = { quantity: qty, cost };
      totalCost += cost;
    }

    return { byType, totalCost };
  } catch (error) {
    logger.warn('[BILLING] Could not aggregate monthly usage', { error: error instanceof Error ? error.message : error });
    return { byType: {}, totalCost: 0 };
  }
}
