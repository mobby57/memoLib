/**
 * Service d'escalade — PLAN_COMPLET.md §5.5
 *
 * Règles :
 * - Email non traité 24h  → notification ADMIN
 * - Email non traité 48h  → notification SUPER_ADMIN
 * - Deadline dépassée     → incident P2 + escalade MANAGER
 * - 3 deadlines dépassées/mois → rapport + recommandation ADMIN
 */

import { prisma } from '@/lib/prisma';

export interface EscalationResult {
  emailsEscalated24h: number;
  emailsEscalated48h: number;
  deadlinesEscalated: number;
  monthlyReports: number;
}

export async function runEscalation(): Promise<EscalationResult> {
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 3600_000);
  const h48 = new Date(now.getTime() - 48 * 3600_000);

  const [emails24h, emails48h, overdueDeadlines] = await Promise.all([
    // Emails non traités depuis 24h (pas encore escaladés)
    prisma.email.findMany({
      where: {
        isProcessed: false,
        isArchived: false,
        receivedAt: { lte: h24, gt: h48 },
      },
      select: { id: true, tenantId: true, from: true, subject: true },
    }),

    // Emails non traités depuis 48h
    prisma.email.findMany({
      where: {
        isProcessed: false,
        isArchived: false,
        receivedAt: { lte: h48 },
      },
      select: { id: true, tenantId: true, from: true, subject: true },
    }),

    // Deadlines dépassées non encore escaladées
    prisma.legalDeadline.findMany({
      where: {
        status: 'OVERDUE',
        escalatedAt: null,
      },
      include: {
        Dossier: { select: { numero: true, responsableId: true } },
        Tenant: { select: { id: true } },
      },
    }),
  ]);

  // --- Escalade emails 24h → ADMIN du tenant ---
  for (const email of emails24h) {
    const admin = await getAdminForTenant(email.tenantId);
    if (admin) {
      await createEscalationNotification(admin.id, {
        type: 'email_unprocessed_24h',
        title: 'Email non traité depuis 24h',
        message: `Email de ${email.from} — "${email.subject}" attend une action.`,
        priority: 'high',
      });
    }
  }

  // --- Escalade emails 48h → SUPER_ADMIN ---
  for (const email of emails48h) {
    const superAdmin = await getSuperAdmin();
    if (superAdmin) {
      await createEscalationNotification(superAdmin.id, {
        type: 'email_unprocessed_48h',
        title: 'Email non traité depuis 48h',
        message: `Tenant ${email.tenantId} — Email de ${email.from} toujours non traité.`,
        priority: 'high',
      });
    }
  }

  // --- Escalade deadlines dépassées → MANAGER ---
  let deadlinesEscalated = 0;
  for (const deadline of overdueDeadlines) {
    const manager = await getManagerForTenant(deadline.tenantId);
    const escalateTo = manager?.id || deadline.Dossier?.responsableId || null;

    if (escalateTo) {
      const notified = await createEscalationNotification(escalateTo, {
        type: 'deadline_overdue',
        title: `⚠️ Deadline dépassée — ${deadline.label}`,
        message: `Dossier ${deadline.Dossier?.numero || deadline.dossierId} — échéance dépassée le ${deadline.dueDate.toLocaleDateString('fr-FR')}.`,
        priority: 'high',
      }, deadline.id);
      if (notified) {
        await prisma.legalDeadline.update({
          where: { id: deadline.id },
          data: { escalatedAt: now, escalatedTo: escalateTo },
        });
        deadlinesEscalated++;
      }
    }
  }

  // --- Rapport mensuel si 3+ deadlines dépassées ce mois ---
  const monthlyReports = await checkMonthlyOverdueThreshold(now);

  return {
    emailsEscalated24h: emails24h.length,
    emailsEscalated48h: emails48h.length,
    deadlinesEscalated,
    monthlyReports,
  };
}

async function checkMonthlyOverdueThreshold(now: Date): Promise<number> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Group overdue deadlines by tenant this month
  const overdueByTenant = await prisma.legalDeadline.groupBy({
    by: ['tenantId'],
    where: {
      status: 'OVERDUE',
      updatedAt: { gte: monthStart },
    },
    _count: { id: true },
    having: { id: { _count: { gte: 3 } } },
  });

  let reports = 0;
  for (const row of overdueByTenant) {
    const admin = await getAdminForTenant(row.tenantId);
    if (admin) {
      await createEscalationNotification(admin.id, {
        type: 'monthly_overdue_threshold',
        title: `${row._count.id} deadlines dépassées ce mois`,
        message: `Votre cabinet a dépassé ${row._count.id} échéances ce mois. Consultez le tableau de risques.`,
        priority: 'normal',
      });
      reports++;
    }
  }
  return reports;
}

// --- Helpers ---

async function getAdminForTenant(tenantId: string) {
  return prisma.user.findFirst({
    where: { tenantId, role: { in: ['ADMIN', 'admin'] }, status: 'active' },
    select: { id: true },
  });
}

async function getManagerForTenant(tenantId: string) {
  return prisma.user.findFirst({
    where: { tenantId, role: { in: ['MANAGER', 'manager'] }, status: 'active' },
    select: { id: true },
  });
}

async function getSuperAdmin() {
  return prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'super_admin'] }, status: 'active' },
    select: { id: true },
  });
}

async function createEscalationNotification(
  userId: string,
  data: { type: string; title: string; message: string; priority: string },
  deadlineId?: string
) {
  // Déduplication : pas de doublon si même type + userId dans les 4 dernières heures
  const recent = await prisma.notification.findFirst({
    where: {
      userId,
      type: data.type,
      ...(deadlineId ? { data: { contains: `"deadlineId":"${deadlineId}"` } } : {}),
      createdAt: { gte: new Date(Date.now() - 4 * 3600_000) },
    },
  });
  if (recent) return false;

  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority,
      ...(deadlineId ? { data: JSON.stringify({ deadlineId }) } : {}),
    },
  });
  return true;
}
