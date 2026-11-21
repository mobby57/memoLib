import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { sendEmail } from '@/lib/email/email-service';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/rappel-audiences
 * Cron quotidien : envoie un rappel J-1 pour les audiences du lendemain.
 * Inclut un resume du dossier.
 */
export async function GET(request: NextRequest) {
  const prisma = await getSecurePrisma();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const audiences = await prisma.calendarEvent.findMany({
    where: {
      startDate: { gte: tomorrow, lt: dayAfter },
      type: { in: ['audience', 'AUDIENCE', 'rdv_tribunal'] },
    },
    include: {
      dossier: {
        select: { numero: true, typeDossier: true, objet: true, juridiction: true, Client: { select: { email: true } } },
      },
    },
  });

  let rappelsEnvoyes = 0;
  for (const audience of audiences) {
    const clientEmail = audience.dossier?.Client?.email;
    if (!clientEmail) continue;
    const sent = await sendEmail({
      to: clientEmail,
      subject: 'Rappel - audience demain',
      html: '<p>Votre audience est prevue demain. Merci de consulter les informations de votre dossier.</p>',
      text: 'Votre audience est prevue demain. Merci de consulter les informations de votre dossier.',
    });
    if (sent.success) rappelsEnvoyes++;
  }
  logger.info('Rappels audiences traites', {
    audienceCount: audiences.length,
    sentCount: rappelsEnvoyes,
  });

  return NextResponse.json({
    success: true,
    audiencesDemain: audiences.length,
    rappelsEnvoyes,
  });
}

