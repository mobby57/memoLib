import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { z } from 'zod';
import {
  calculerDateLimiteUniverselle,
  TypeProcedure,
  getJuridiction,
  CESEDA_TAXONOMY,
} from '@/lib/ceseda-delais';

// --- Validation Zod ---
const CreateCaseSchema = z.object({
  title: z.string().min(3, 'Le titre est trop court').max(200),
  clientId: z.string().cuid('clientId invalide'),
  typeProcedure: z.enum([
    'REFUS_TITRE_2MOIS', 'REFUS_RENOUVELLEMENT_2MOIS', 'RETRAIT_TITRE_2MOIS',
    'OQTF_48H', 'OQTF_7J', 'OQTF_30J', 'RETENTION_48H', 'IRTF_2MOIS',
    'REFUS_OFPRA_1MOIS', 'REFUS_CNDA_2MOIS',
    'REFUS_NATURALISATION_2MOIS', 'REFUS_VISA_CRV_2MOIS',
  ] as const),
  dateNotification: z.string().datetime({ offset: true }).optional().nullable(),
  prefecture: z.string().max(100).optional().nullable(),
  numeroAGDREF: z.string().max(50).optional().nullable(),
  paysOrigine: z.string().max(100).optional().nullable(),
});

export async function POST(req: Request) {
  const prisma = await getSecurePrisma();
  try {
    // 1. Auth Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    // 2. RÃ©cupÃ©rer le tenantId depuis les mÃ©tadonnÃ©es Clerk
    const tenantId = (user.publicMetadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Cabinet (tenant) introuvable' }, { status: 403 });
    }

    // 3. Validation Zod
    const body = await req.json();
    const parsed = CreateCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'DonnÃ©es invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, clientId, typeProcedure, dateNotification, prefecture, numeroAGDREF, paysOrigine } =
      parsed.data;

    // 4. VÃ©rifier que le client appartient bien au tenant
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client introuvable dans ce cabinet' }, { status: 404 });
    }

    // 5. Calcul automatique de la date limite CESEDA
    const regle = CESEDA_TAXONOMY[typeProcedure as TypeProcedure];
    let dateLimiteRecours: Date | null = null;
    if (dateNotification) {
      dateLimiteRecours = calculerDateLimiteUniverselle(
        typeProcedure as TypeProcedure,
        new Date(dateNotification)
      );
    }

    // 6. CrÃ©er le dossier avec tenantId
    const newCase = await prisma.case.create({
      data: {
        title,
        tenantId,
        clientId,
        categorieCESEDA: regle.categorie,
        typeProcedure,
        juridiction: regle.juridiction,
        prefecture: prefecture ?? null,
        numeroAGDREF: numeroAGDREF ?? null,
        paysOrigine: paysOrigine ?? null,
        dateNotification: dateNotification ? new Date(dateNotification) : null,
        dateLimiteRecours,
        statut: 'OUVERT',
      },
    });

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (error) {
    console.error('[CASES_POST]', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const prisma = await getSecurePrisma();
  try {
    // 1. Auth
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const tenantId = (user.publicMetadata as { tenantId?: string })?.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Cabinet (tenant) introuvable' }, { status: 403 });
    }

    // 2. Filtrage strict par tenantId
    const { searchParams } = new URL(req.url);
    const statut = searchParams.get('statut') ?? undefined;

    const cases = await prisma.case.findMany({
      where: {
        tenantId,
        ...(statut ? { statut } : {}),
      },
      orderBy: { dateLimiteRecours: 'asc' },
      take: 50,
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('[CASES_GET]', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

