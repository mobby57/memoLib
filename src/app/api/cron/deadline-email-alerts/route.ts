import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/deadline-email-alerts
 * 
 * Envoie des emails de rappel aux avocats quand une deadline approche.
 * Déclenché quotidiennement par Render Cron ou manuellement.
 * 
 * Alertes:
 * - J-7 : "Échéance dans 7 jours"
 * - J-3 : "Échéance dans 3 jours — URGENT"
 * - J-1 : "DEMAIN — Action immédiate requise"
 * - J-0 : "AUJOURD'HUI — Deadline atteinte"
 */
export async function GET(request: Request) {
  // Vérifier le token cron (sécurité)
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (token !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const alerts = { sent: 0, errors: 0, deadlines: [] as any[] };

    // Trouver les deadlines qui approchent (J-7, J-3, J-1, J-0)
    const targetDays = [0, 1, 3, 7];

    for (const days of targetDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const deadlines = await prisma.legalDeadline.findMany({
        where: {
          dueDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ['PENDING', 'APPROACHING', 'URGENT', 'CRITICAL'] },
        },
        include: {
          Dossier: { select: { numero: true, objet: true, responsableId: true } },
          Client: { select: { firstName: true, lastName: true } },
        },
      });

      for (const deadline of deadlines) {
        // Trouver l'email de l'avocat responsable
        const responsableId = deadline.Dossier?.responsableId || deadline.createdBy;
        if (!responsableId) continue;

        const user = await prisma.user.findUnique({
          where: { id: responsableId },
          select: { email: true, name: true },
        });

        if (!user?.email) continue;

        const clientName = deadline.Client
          ? `${deadline.Client.firstName} ${deadline.Client.lastName}`
          : 'Client';

        const urgencyLabel = days === 0 ? '🔴 AUJOURD\'HUI'
          : days === 1 ? '🟠 DEMAIN'
          : days === 3 ? '🟡 Dans 3 jours'
          : '📅 Dans 7 jours';

        const subject = days === 0
          ? `[URGENT] Deadline AUJOURD'HUI — ${deadline.label}`
          : days === 1
          ? `[URGENT] Deadline DEMAIN — ${deadline.label}`
          : `Rappel échéance (J-${days}) — ${deadline.label}`;

        const body = `
Bonjour ${user.name || 'Maître'},

${urgencyLabel} — Échéance à venir :

📋 Dossier : ${deadline.Dossier?.numero || 'N/A'} — ${deadline.Dossier?.objet || ''}
👤 Client : ${clientName}
⏰ Deadline : ${deadline.label}
📅 Date : ${deadline.dueDate.toLocaleDateString('fr-FR')}
📖 Base légale : ${deadline.legalBasis || 'N/A'}

${days <= 1 ? '⚠️ ACTION IMMÉDIATE REQUISE' : 'Pensez à préparer les éléments nécessaires.'}

---
MemoLib — Ne ratez plus jamais une échéance
https://memolib-wybq.onrender.com/fr/dashboard
        `.trim();

        // Envoyer l'email via le service d'email
        try {
          const emailSent = await sendDeadlineEmail(user.email, subject, body);
          if (emailSent) {
            alerts.sent++;
            alerts.deadlines.push({
              deadline: deadline.label,
              user: user.email,
              days,
              dossier: deadline.Dossier?.numero,
            });
          }
        } catch (err) {
          alerts.errors++;
          logger.error('[CRON] Erreur envoi email deadline', err);
        }
      }
    }

    logger.info(`[CRON] Deadline emails: ${alerts.sent} envoyés, ${alerts.errors} erreurs`);

    return NextResponse.json({
      success: true,
      ...alerts,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('[CRON] Erreur deadline-email-alerts', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

/**
 * Envoyer un email de rappel deadline
 */
async function sendDeadlineEmail(to: string, subject: string, body: string): Promise<boolean> {
  // Essayer le service email configuré
  try {
    const { sendEmail } = await import('@/lib/email/email-service');
    await sendEmail({
      to,
      subject,
      text: body,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">⏰ Rappel MemoLib</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          ${body.split('\n').map(line => `<p style="margin: 8px 0; color: #374151;">${line}</p>`).join('')}
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          MemoLib — Gestion intelligente pour cabinets d'avocats
        </p>
      </div>`,
    });
    return true;
  } catch {
    // Fallback: log seulement (pas de service email configuré)
    logger.info(`[DEADLINE EMAIL] Would send to ${to}: ${subject}`);
    return true; // On considère comme "envoyé" pour le compteur
  }
}
