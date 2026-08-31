import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { auditService } from '@/lib/ai/auditService';

export async function checkAuditAlerts() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  for (const tenant of tenants) {
    const stats = await auditService.getStats(tenant.id);
    if (stats.avgConfidence < 0.6) {
      logger.warn('Confiance IA basse détectée', {
        tenant: tenant.name,
        avgConfidence: stats.avgConfidence,
      });
    }
    if (stats.unreviewed > 10) {
      logger.warn('Nombre de décisions IA non revues élevé', {
        tenant: tenant.name,
        unreviewed: stats.unreviewed,
      });
    }
  }
}
