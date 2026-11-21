import { NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { sendEmail } from '@/lib/email/email-service';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/relance-pieces
 * Cron quotidien : envoie une relance aux clients dont des pieces sont manquantes depuis +7 jours.
 * Appele par Vercel Cron ou manuellement.
 */
export async function GET() {
  const prisma = await getSecurePrisma();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Trouver les dossiers avec pieces manquantes depuis +7j
  const dossiers = await prisma.dossier.findMany({
    where: {
      checklistComplete: false,
      checklistTotal: { gt: 0 },
      createdAt: { lt: sevenDaysAgo },
      statut: { in: ['en_cours', 'nouveau'] },
    },
    include: {
      client: true,
      checklistItems: { where: { status: 'missing', required: true } },
    },
  });

  let relancesSent = 0;

  for (const dossier of dossiers) {
    if (!dossier.client?.email || dossier.checklistItems.length === 0) continue;

    const missingPieces = dossier.checklistItems.map(i => `- ${i.label}`).join('\n');

    const sent = await sendEmail({
      to: dossier.client.email,
      subject: `Pieces manquantes - dossier ${dossier.numero}`,
      html: `<p>Bonjour,</p><p>Il manque les pieces suivantes pour votre dossier :</p><pre>${missingPieces}</pre><p>Merci de les transmettre a votre cabinet.</p>`,
      text: `Bonjour,\n\nIl manque les pieces suivantes pour votre dossier :\n${missingPieces}\n\nMerci de les transmettre a votre cabinet.`,
    });
    if (sent.success) {
      relancesSent++;
    } else {
      logger.error('Echec relance pieces', undefined, {
        tenantId: dossier.tenantId,
        dossierId: dossier.id,
      });
    }
  }

  return NextResponse.json({
    success: true,
    relancesSent,
    dossiersChecked: dossiers.length,
    message: `${relancesSent} relance(s) envoyee(s)`,
  });
}

