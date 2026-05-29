import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/rappel-audiences
 * Cron quotidien : envoie un rappel J-1 pour les audiences du lendemain.
 * Inclut un resume du dossier.
 */
export async function GET() {
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
        select: { numero: true, typeDossier: true, objet: true, juridiction: true, client: { select: { nom: true } } },
      },
    },
  });

  const rappels = audiences.map(a => ({
    eventId: a.id,
    date: a.startDate,
    dossier: a.dossier?.numero,
    client: a.dossier?.client?.nom,
    juridiction: a.dossier?.juridiction,
    type: a.dossier?.typeDossier,
    resume: `Audience ${a.dossier?.typeDossier} — ${a.dossier?.client?.nom} — ${a.dossier?.juridiction || 'Tribunal'}`,
  }));

  // TODO: envoyer email/SMS avec le resume
  rappels.forEach(r => {
    console.log(`[RAPPEL J-1] ${r.resume} le ${new Date(r.date).toLocaleDateString('fr-FR')}`);
  });

  return NextResponse.json({
    success: true,
    audiencesDemain: rappels.length,
    rappels,
  });
}
