import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { findActiveClientDossierGrant } from '@/lib/client-access';
import { withTenantContext } from '@/lib/prisma';

const intakeSchema = z.object({
  nom: z.string().trim().min(1).max(120),
  prenom: z.string().trim().min(1).max(120),
  adresse: z.string().trim().min(1).max(500),
  recit: z.string().trim().min(1).max(20_000),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id: dossierId } = await params;
  const access = await findActiveClientDossierGrant(userId, dossierId);
  if (!access) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }
  const parsedBody = intakeSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Informations invalides' }, { status: 400 });
  }

  const updated = await withTenantContext<{ count: number }>(access.grant.tenantId, transaction =>
    transaction.dossier.updateMany({
      where: { id: dossierId, tenantId: access.grant.tenantId },
      data: {
        clientNom: parsedBody.data.nom,
        clientPrenom: parsedBody.data.prenom,
        clientAdresse: parsedBody.data.adresse,
        recitClient: parsedBody.data.recit,
        statut: 'en_cours',
        updatedAt: new Date(),
      },
    })
  );
  if (updated.count !== 1) {
    return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
