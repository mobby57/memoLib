import { logger } from '@/lib/logger';

interface UsageRecord {
  tenantId: string;
  type: 'ocr' | 'signature' | 'sms' | 'ai';
  quantity: number;
  metadata?: Record<string, unknown>;
}

export async function recordUsage(record: UsageRecord): Promise<void> {
  logger.info('[BILLING] Usage recorded', { type: record.type, qty: record.quantity, tenant: record.tenantId });
}
