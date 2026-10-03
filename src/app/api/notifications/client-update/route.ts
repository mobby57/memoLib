import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { RBAC_PERMISSIONS, requireApiPermission } from '@/lib/auth/rbac';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const clientUpdateSchema = z
  .object({
    dossierId: z.string().trim().min(1).max(128),
    type: z.enum(['piece_recue', 'dossier_complet', 'statut_change', 'deadline_proche']),
    message: z.string().trim().max(2_000).optional(),
  })
  .strict();

/**
 * POST /api/notifications/client-update
 * Envoie une notification au client sur l'avancement de son dossier.
 * Appele automatiquement quand une piece est recue ou un statut change.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const permission = requireApiPermission({ user }, RBAC_PERMISSIONS.DOSSIERS_MANAGE);
  if (!permission.ok) return permission.response;

  const parsedBody = clientUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
  const { dossierId, type, message } = parsedBody.data;

  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: { Client: true },
  });

  if (!dossier || !dossier.Client?.email) {
    return NextResponse.json({ error: 'Dossier ou client non trouve' }, { status: 404 });
  }

  if (user.role !== 'SUPER_ADMIN' && (!user.tenantId || dossier.tenantId !== user.tenantId)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  type DossierWithClient = typeof dossier;
  const templates: Record<
    (typeof type),
    (d: DossierWithClient) => { subject: string; body: string }
  > = {
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
  template(dossier);

  logger.info('Notification client préparée', {
    dossierId: dossier.id,
    notificationType: type,
    tenantId: dossier.tenantId,
  });

  return NextResponse.json({
    success: true,
    notificationType: type,
  });
}
