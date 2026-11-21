import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { sendEmail } from '@/lib/email/email-service';
import { z } from 'zod';

const notificationSchema = z.object({
  dossierId: z.string().min(1),
  type: z.enum(['piece_recue', 'dossier_complet', 'statut_change', 'deadline_proche']),
  message: z.string().max(5000).optional(),
});

/**
 * POST /api/notifications/client-update
 * Envoie une notification au client sur l'avancement de son dossier.
 * Appele automatiquement quand une piece est recue ou un statut change.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSessionCompat();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorise' }, { status: session?.user ? 403 : 401 });
  }
  let requestBody: unknown;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = notificationSchema.safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
  }
  const prisma = await getSecurePrisma();
  const { dossierId, type, message } = parsed.data;

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: session.user.tenantId },
    include: { client: true },
  });

  if (!dossier || !dossier.client?.email) {
    return NextResponse.json({ error: 'Dossier ou client non trouve' }, { status: 404 });
  }

  const templates: Record<string, (d: any) => { subject: string; body: string }> = {
    piece_recue: (d) => ({
      subject: `Piece recue â€” Dossier ${d.numero}`,
      body: `Bonjour,\n\nNous avons bien recu votre document pour le dossier ${d.numero}.\n\nProgression : ${d.checklistReceived}/${d.checklistTotal} pieces recues.\n${d.checklistComplete ? '\nVotre dossier est maintenant COMPLET. Votre avocat va le traiter dans les meilleurs delais.' : `\nIl reste ${d.checklistTotal - d.checklistReceived} piece(s) a fournir.`}\n\nCordialement,\nCabinet ${d.tenantId}`,
    }),
    dossier_complet: (d) => ({
      subject: `Dossier COMPLET â€” ${d.numero}`,
      body: `Bonjour,\n\nToutes les pieces de votre dossier ${d.numero} ont ete recues.\n\nVotre avocat va maintenant traiter votre dossier. Vous serez informe de la suite.\n\nCordialement`,
    }),
    statut_change: (d) => ({
      subject: `Mise a jour â€” Dossier ${d.numero}`,
      body: message || `Bonjour,\n\nLe statut de votre dossier ${d.numero} a ete mis a jour.\n\nNouveau statut : ${d.statut}\n\nCordialement`,
    }),
    deadline_proche: (d) => ({
      subject: `URGENT â€” Echeance proche dossier ${d.numero}`,
      body: `Bonjour,\n\nUne echeance importante approche pour votre dossier ${d.numero}.\n\n${message || 'Merci de nous contacter rapidement.'}\n\nCordialement`,
    }),
  };

  const template = templates[type];
  if (!template) {
    return NextResponse.json({ error: `Type inconnu: ${type}` }, { status: 400 });
  }

  const { subject, body: emailBody } = template(dossier);

  const sent = await sendEmail({
    to: dossier.client.email,
    subject,
    html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${emailBody.replace(/\n/g, '<br>')}</div>`,
    text: emailBody,
  });
  if (!sent.success) {
    return NextResponse.json({ error: 'Envoi email impossible' }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    subject,
    preview: emailBody.substring(0, 100) + '...',
  });
}

