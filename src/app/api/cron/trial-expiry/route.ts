/**
 * CRON: /api/cron/trial-expiry
 * 
 * Envoie des emails aux utilisateurs dont l'essai gratuit expire bientÃ´t.
 * - J-3 : "Votre essai expire dans 3 jours"
 * - J-1 : "Dernier jour d'essai"
 * - J+1 : "Votre essai a expirÃ©" (avec CTA vers upgrade)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { sendEmail } from '@/lib/email/email-service';
import { logger } from '@/lib/logger';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in1day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    // Subscriptions en trial
    const trialingSubs = await prisma.subscription.findMany({
      where: { status: 'trialing', trialEnd: { not: null } },
      include: {
        Tenant: {
          include: {
            User: { where: { role: 'AVOCAT' }, take: 1, select: { email: true, name: true } },
          },
        },
      },
    });

    let sent = 0;

    for (const sub of trialingSubs) {
      const trialEnd = sub.trialEnd!;
      const user = (sub as any).Tenant?.User?.[0];
      if (!user?.email) continue;

      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const tenantName = (sub as any).Tenant?.name || 'votre cabinet';

      let emailType: 'j3' | 'j1' | 'expired' | null = null;
      if (daysLeft === 3) emailType = 'j3';
      else if (daysLeft === 1) emailType = 'j1';
      else if (daysLeft <= 0 && daysLeft >= -1) emailType = 'expired';

      if (!emailType) continue;

      // Anti-spam : vÃ©rifier via metadata qu'on n'a pas dÃ©jÃ  envoyÃ©
      const metaKey = `trial_email_${emailType}`;
      const currentMeta = sub.metadata ? JSON.parse(sub.metadata) : {};
      if (currentMeta[metaKey]) continue;

      const appUrl = process.env.NEXTAUTH_URL || 'https://memolib.space';

      const templates = {
        j3: {
          subject: `â° Votre essai MemoLib expire dans 3 jours`,
          html: `<div style="font-family: sans-serif; max-width: 600px;">
            <h2>Bonjour ${user.name || 'MaÃ®tre'},</h2>
            <p>Votre essai gratuit de MemoLib pour <strong>${tenantName}</strong> expire dans <strong>3 jours</strong>.</p>
            <p>Pour continuer Ã  utiliser toutes les fonctionnalitÃ©s (IA, emails, documents), activez votre abonnement :</p>
            <a href="${appUrl}/fr/billing" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">Choisir mon plan â†’</a>
            <p style="color:#666;">Ã€ partir de 29â‚¬/mois â€¢ Sans engagement</p>
          </div>`,
        },
        j1: {
          subject: `âš ï¸ Dernier jour d'essai MemoLib !`,
          html: `<div style="font-family: sans-serif; max-width: 600px;">
            <h2>Bonjour ${user.name || 'MaÃ®tre'},</h2>
            <p>C'est votre <strong>dernier jour</strong> d'essai gratuit de MemoLib.</p>
            <p>Demain, vous perdrez l'accÃ¨s Ã  :</p>
            <ul><li>L'IA juridique (rÃ©sumÃ©s, brouillons)</li><li>La synchronisation email</li><li>La gÃ©nÃ©ration de documents</li></ul>
            <a href="${appUrl}/fr/billing" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">Activer mon abonnement maintenant</a>
          </div>`,
        },
        expired: {
          subject: `ðŸ˜¢ Votre essai MemoLib a expirÃ©`,
          html: `<div style="font-family: sans-serif; max-width: 600px;">
            <h2>Bonjour ${user.name || 'MaÃ®tre'},</h2>
            <p>Votre essai gratuit est terminÃ©. Vos donnÃ©es sont conservÃ©es <strong>30 jours</strong> â€” il n'est pas trop tard !</p>
            <p>RÃ©activez votre compte en choisissant un plan :</p>
            <a href="${appUrl}/fr/billing" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">RÃ©activer mon cabinet â†’</a>
            <p style="color:#666;">Vos dossiers, clients et emails sont intacts.</p>
          </div>`,
        },
      };

      try {
        const template = templates[emailType];
        await sendEmail({ to: user.email, subject: template.subject, html: template.html });

        // Marquer comme envoyÃ©
        currentMeta[metaKey] = new Date().toISOString();
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { metadata: JSON.stringify(currentMeta) },
        });

        sent++;
      } catch (error) {
        logger.warn('Failed to send trial expiry email', { subId: sub.id, error });
      }
    }

    return NextResponse.json({
      message: `Trial expiry emails: ${sent} sent`,
      sent,
      totalTrialing: trialingSubs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Trial expiry cron failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

