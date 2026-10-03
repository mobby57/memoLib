import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/relance-pieces
 * Cron quotidien : envoie une relance aux clients dont des pieces sont manquantes depuis +7 jours.
 * Appele par Vercel Cron ou manuellement.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 503 });
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

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

    // TODO: envoyer email reel via service email
    // await sendEmail({
    //   to: dossier.client.email,
    //   subject: `Rappel — Pieces manquantes pour votre dossier ${dossier.numero}`,
    //   body: `Bonjour,\n\nIl manque les pieces suivantes pour votre dossier:\n${missingPieces}\n\nMerci de les envoyer a: ${dossier.inboxEmail}\n\nCordialement,\nVotre avocat`
    // });

    relancesSent++;
  }

  logger.info('Cron relance-pieces exécuté', {
    dossiersChecked: dossiers.length,
    relancesPrepared: relancesSent,
  });

  return NextResponse.json({
    success: true,
    relancesPrepared: relancesSent,
    dossiersChecked: dossiers.length,
    message: `${relancesSent} relance(s) préparée(s)`,
  });
}
