import { prisma, withTenantContext } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface EscalationResult {
  emailsEscalated24h: number;
  emailsEscalated48h: number;
  deadlinesEscalated: number;
  monthlyReports: number;
}

export async function runEscalation(): Promise<EscalationResult> {
  let totalEmails24h = 0;
  let totalEmails48h = 0;
  let totalDeadlinesEscalated = 0;
  let totalMonthlyReports = 0;

  const tenants = await prisma.tenant.findMany({ where: { status: 'active' }, select: { id: true } });

  for (const { id: tenantId } of tenants) {
    await withTenantContext(tenantId, async (tx) => {
      const now = new Date();
      const h24 = new Date(now.getTime() - 24 * 3600_000);
      const h48 = new Date(now.getTime() - 48 * 3600_000);

      const [emails24h, emails48h, overdueDeadlines] = await Promise.all([
        tx.email.findMany({ where: { tenantId, isProcessed: false, isArchived: false, receivedAt: { lte: h24, gt: h48 } }, select: { id: true, tenantId: true, from: true, subject: true } }),
        tx.email.findMany({ where: { tenantId, isProcessed: false, isArchived: false, receivedAt: { lte: h48 } }, select: { id: true, tenantId: true, from: true, subject: true } }),
        tx.legalDeadline.findMany({ where: { tenantId, status: 'OVERDUE', escalatedAt: null }, include: { Dossier: { select: { numero: true, responsableId: true } }, Tenant: { select: { id: true } } } }),
      ]);

      totalEmails24h += emails24h.length;
      totalEmails48h += emails48h.length;

      for (const email of emails24h) {
        const admin = await getAdminForTenant(tx, tenantId);
        if (admin) await createEscalationNotification(tx, admin.id, { type: 'email_unprocessed_24h', title: 'Email non traité depuis 24h', message: `Email de ${email.from} — "${email.subject}" attend une action.`, priority: 'high' });
      }

      for (const email of emails48h) {
        const superAdmin = await getSuperAdmin(tx);
        if (superAdmin) await createEscalationNotification(tx, superAdmin.id, { type: 'email_unprocessed_48h', title: 'Email non traité depuis 48h', message: `Tenant ${tenantId} — Email de ${email.from} toujours non traité.`, priority: 'high' });
      }

      let localDeadlinesEscalated = 0;
      for (const deadline of overdueDeadlines) {
        const manager = await getManagerForTenant(tx, tenantId);
        const escalateTo = manager?.id || deadline.Dossier?.responsableId || null;
        if (escalateTo) {
          const notified = await createEscalationNotification(tx, escalateTo, {
            type: 'deadline_overdue',
            title: `⚠️ Deadline dépassée — ${deadline.label}`,
            message: `Dossier ${deadline.Dossier?.numero || deadline.dossierId} — échéance dépassée le ${deadline.dueDate.toLocaleDateString('fr-FR')}.`,
            priority: 'high',
          }, deadline.id);
          if (notified) {
            await tx.legalDeadline.update({ where: { id: deadline.id }, data: { escalatedAt: now, escalatedTo: escalateTo } });
            localDeadlinesEscalated++;
          }
        }
      }
      totalDeadlinesEscalated += localDeadlinesEscalated;

      const monthlyReports = await checkMonthlyOverdueThreshold(tx, tenantId, now);
      totalMonthlyReports += monthlyReports;
    });
  }

  return {
    emailsEscalated24h: totalEmails24h,
    emailsEscalated48h: totalEmails48h,
    deadlinesEscalated: totalDeadlinesEscalated,
    monthlyReports: totalMonthlyReports,
  };
}

async function checkMonthlyOverdueThreshold(tx: any, tenantId: string, now: Date): Promise<number> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const overdueCount = await tx.legalDeadline.count({
    where: { tenantId, status: 'OVERDUE', updatedAt: { gte: monthStart } },
  });
  if (overdueCount >= 3) {
    const admin = await getAdminForTenant(tx, tenantId);
    if (admin) {
      await createEscalationNotification(tx, admin.id, {
        type: 'monthly_overdue_threshold',
        title: `${overdueCount} deadlines dépassées ce mois`,
        message: `Votre cabinet a dépassé ${overdueCount} échéances ce mois. Consultez le tableau de risques.`,
        priority: 'normal',
      });
      return 1;
    }
  }
  return 0;
}

async function getAdminForTenant(tx: any, tenantId: string) {
  return tx.user.findFirst({ where: { tenantId, role: { in: ['ADMIN', 'admin'] }, status: 'active' }, select: { id: true } });
}

async function getManagerForTenant(tx: any, tenantId: string) {
  return tx.user.findFirst({ where: { tenantId, role: { in: ['MANAGER', 'manager'] }, status: 'active' }, select: { id: true } });
}

async function getSuperAdmin(tx: any) {
  return tx.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'super_admin'] }, status: 'active' }, select: { id: true } });
}

async function createEscalationNotification(tx: any, userId: string, data: { type: string; title: string; message: string; priority: string }, deadlineId?: string): Promise<boolean> {
  const recent = await tx.notification.findFirst({
    where: { userId, type: data.type, ...(deadlineId ? { data: { contains: `"deadlineId":"${deadlineId}"` } } : {}), createdAt: { gte: new Date(Date.now() - 4 * 3600_000) } },
  });
  if (recent) return false;

  await tx.notification.create({
    data: { id: randomUUID(), userId, type: data.type, title: data.title, message: data.message, priority: data.priority, ...(deadlineId ? { data: JSON.stringify({ deadlineId }) } : {}) },
  });
  return true;
}