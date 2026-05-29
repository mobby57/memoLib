import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/notifications/client-update
 * Envoie une notification au client sur l'avancement de son dossier.
 * Appele automatiquement quand une piece est recue ou un statut change.
 */
export async function POST(req: NextRequest) {
  const { dossierId, type, message } = await req.json();

  if (!dossierId || !type) {
    return NextResponse.json({ error: 'dossierId et type requis' }, { status: 400 });
  }

  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: { client: true },
  });

  if (!dossier || !dossier.client?.email) {
    return NextResponse.json({ error: 'Dossier ou client non trouve' }, { status: 404 });
  }

  const templates: Record<string, (d: any) => { subject: string; body: string }> = {
    piece_recue: (d) => ({
      subject: `Piece recue — Dossier ${d.numero}`,
      body: `Bonjour,\n\nNous avons bien recu votre document pour le dossier ${d.numero}.\n\nProgression : ${d.checklistReceived}/${d.checklistTotal} pieces recues.\n${d.checklistComplete ? '\nVotre dossier est maintenant COMPLET. Votre avocat va le traiter dans les meilleurs delais.' : `\nIl reste ${d.checklistTotal - d.checklistReceived} piece(s) a fournir.`}\n\nCordialement,\nCabinet ${d.tenantId}`,
    }),
    dossier_complet: (d) => ({
      subject: `Dossier COMPLET — ${d.numero}`,
      body: `Bonjour,\n\nToutes les pieces de votre dossier ${d.numero} ont ete recues.\n\nVotre avocat va maintenant traiter votre dossier. Vous serez informe de la suite.\n\nCordialement`,
    }),
    statut_change: (d) => ({
      subject: `Mise a jour — Dossier ${d.numero}`,
      body: message || `Bonjour,\n\nLe statut de votre dossier ${d.numero} a ete mis a jour.\n\nNouveau statut : ${d.statut}\n\nCordialement`,
    }),
    deadline_proche: (d) => ({
      subject: `URGENT — Echeance proche dossier ${d.numero}`,
      body: `Bonjour,\n\nUne echeance importante approche pour votre dossier ${d.numero}.\n\n${message || 'Merci de nous contacter rapidement.'}\n\nCordialement`,
    }),
  };

  const template = templates[type];
  if (!template) {
    return NextResponse.json({ error: `Type inconnu: ${type}` }, { status: 400 });
  }

  const { subject, body } = template(dossier);

  // Log (email reel quand SMTP configure)
  console.log(`[NOTIF CLIENT] To: ${dossier.client.email} | Subject: ${subject}`);

  return NextResponse.json({
    success: true,
    to: dossier.client.email,
    subject,
    preview: body.substring(0, 100) + '...',
  });
}
