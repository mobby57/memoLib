/**
 * CRON: /api/cron/invoice-reminders
 * 
 * Envoie des rappels automatiques pour les factures impayées.
 * Exécuté quotidiennement.
 * 
 * Logique:
 * - J+7 après échéance : 1er rappel (poli)
 * - J+15 : 2ème rappel (ferme)
 * - J+30 : mise en demeure
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/email-service';
import { logger } from '@/lib/logger';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const j7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const j15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const j30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Factures en retard (échéance dépassée, pas payées)
    const overdueInvoices = await prisma.facture.findMany({
      where: {
        statut: { in: ['envoyee', 'en_retard'] },
        dateEcheance: { lt: now },
      },
      include: {
        Client: { select: { firstName: true, lastName: true, email: true } },
        Tenant: { select: { name: true, billingEmail: true } },
      },
    });

    let sent = 0;
    let errors = 0;

    for (const facture of overdueInvoices) {
      const clientEmail = (facture as any).Client?.email;
      const clientName = (facture as any).Client 
        ? `${(facture as any).Client.firstName} ${(facture as any).Client.lastName}`
        : 'Client';
      const cabinetName = (facture as any).Tenant?.name || 'Cabinet';
      const echeance = facture.dateEcheance;

      if (!clientEmail || !echeance) continue;

      // Déterminer le niveau de relance
      const daysOverdue = Math.floor((now.getTime() - echeance.getTime()) / (24 * 60 * 60 * 1000));
      let level: 'first' | 'second' | 'formal' | null = null;

      if (daysOverdue >= 30) level = 'formal';
      else if (daysOverdue >= 15) level = 'second';
      else if (daysOverdue >= 7) level = 'first';

      if (!level) continue;

      // Vérifier qu'on n'a pas déjà envoyé ce rappel (1 par niveau par facture)
      const alreadySent = facture.metadata 
        ? JSON.parse(facture.metadata as string || '{}')[`reminder_${level}`] 
        : false;
      if (alreadySent) continue;

      try {
        const subjects: Record<string, string> = {
          first: `Rappel : Facture ${facture.numero} — Échéance dépassée`,
          second: `2ème rappel : Facture ${facture.numero} — Paiement attendu`,
          formal: `Mise en demeure : Facture ${facture.numero}`,
        };

        const bodies: Record<string, string> = {
          first: `<p>Bonjour ${clientName},</p>
<p>Nous nous permettons de vous rappeler que la facture <strong>${facture.numero}</strong> d'un montant de <strong>${facture.montantTTC?.toFixed(2)}€ TTC</strong> est arrivée à échéance le ${echeance.toLocaleDateString('fr-FR')}.</p>
<p>Si le paiement a déjà été effectué, veuillez ne pas tenir compte de ce message.</p>
<p>Cordialement,<br>${cabinetName}</p>`,
          second: `<p>Bonjour ${clientName},</p>
<p>Malgré notre précédent rappel, nous constatons que la facture <strong>${facture.numero}</strong> (${facture.montantTTC?.toFixed(2)}€ TTC) reste impayée.</p>
<p>Nous vous prions de bien vouloir procéder au règlement dans les meilleurs délais.</p>
<p>Cordialement,<br>${cabinetName}</p>`,
          formal: `<p>Bonjour ${clientName},</p>
<p>La présente constitue une mise en demeure de payer la facture <strong>${facture.numero}</strong> d'un montant de <strong>${facture.montantTTC?.toFixed(2)}€ TTC</strong>, échue depuis le ${echeance.toLocaleDateString('fr-FR')}.</p>
<p>À défaut de règlement sous 8 jours, nous nous réservons le droit d'engager des poursuites.</p>
<p>Cordialement,<br>${cabinetName}</p>`,
        };

        await sendEmail({
          to: clientEmail,
          subject: subjects[level],
          html: bodies[level],
        });

        // Marquer le rappel comme envoyé
        const currentMetadata = facture.metadata ? JSON.parse(facture.metadata as string) : {};
        currentMetadata[`reminder_${level}`] = new Date().toISOString();

        await prisma.facture.update({
          where: { id: facture.id },
          data: { 
            statut: 'en_retard',
            metadata: JSON.stringify(currentMetadata),
          },
        });

        sent++;
      } catch (error) {
        errors++;
        logger.warn('Failed to send invoice reminder', { factureId: facture.id, error });
      }
    }

    return NextResponse.json({
      message: `Invoice reminders: ${sent} sent, ${errors} errors`,
      sent,
      errors,
      totalOverdue: overdueInvoices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Invoice reminder cron failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
