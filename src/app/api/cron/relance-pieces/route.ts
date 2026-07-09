import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/relance-pieces
 * Cron quotidien : envoie une relance aux clients dont des pieces sont manquantes depuis +7 jours.
 * Appele par Vercel Cron ou manuellement.
 */
export async function GET() {
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

    // Envoyer la relance (log pour l'instant, email reel quand SMTP configure)
    console.log(`[RELANCE] Dossier ${dossier.numero} → ${dossier.client.email}`);
    console.log(`Pieces manquantes:\n${missingPieces}`);

    // TODO: envoyer email reel via service email
    // await sendEmail({
    //   to: dossier.client.email,
    //   subject: `Rappel — Pieces manquantes pour votre dossier ${dossier.numero}`,
    //   body: `Bonjour,\n\nIl manque les pieces suivantes pour votre dossier:\n${missingPieces}\n\nMerci de les envoyer a: ${dossier.inboxEmail}\n\nCordialement,\nVotre avocat`
    // });

    relancesSent++;
  }

  return NextResponse.json({
    success: true,
    relancesSent,
    dossiersChecked: dossiers.length,
    message: `${relancesSent} relance(s) envoyee(s)`,
  });
}
