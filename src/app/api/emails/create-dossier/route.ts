import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });

  const { emailId, summary } = await req.json();
  if (!summary) return NextResponse.json({ error: 'summary requis' }, { status: 400 });

  try {
    // 1. Créer ou trouver le client
    let client: { id: string; nom: string } | null = null;
    if (summary.client) {
      client = await prisma.client.findFirst({
        where: { tenantId, nom: { contains: summary.client, mode: 'insensitive' } },
      });
      if (!client) {
        client = await prisma.client.create({
          data: { tenantId, nom: summary.client, source: 'EMAIL_AI' },
        });
      }
    }

    // 2. Générer numéro de dossier
    const count = await prisma.dossier.count({ where: { tenantId } });
    const numero = `D-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // 3. Créer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        tenantId,
        numero,
        typeDossier: summary.typeDossier || 'GENERAL',
        objet: summary.objet || `Dossier ${summary.typeDossier}`,
        statut: 'en_cours',
        priorite: summary.urgence === 'critique' ? 'critique' : summary.urgence === 'haute' ? 'haute' : 'normale',
        clientId: client?.id || '',
        responsableId: user.id,
        description: summary.resumeCourt,
      },
    });

    // 4. Lier l'email au dossier
    if (emailId) {
      await prisma.email.update({
        where: { id: emailId },
        data: { dossierId: dossier.id, clientId: client?.id },
      }).catch(() => {});
    }

    // 5. Créer deadline si détectée
    if (summary.deadlineDetectee) {
      const parsed = parseDate(summary.deadlineDetectee);
      if (parsed) {
        await prisma.legalDeadline.create({
          data: {
            tenantId,
            dossierId: dossier.id,
            clientId: client?.id,
            type: 'CUSTOM',
            label: `Échéance détectée par IA — ${summary.objet}`,
            dueDate: parsed,
            status: 'PENDING',
          },
        }).catch(() => {});
      }
    }

    // 6. Auto-créer les délais CESEDA selon le type de dossier
    const cesedaDeadlines = getCesedaDeadlines(summary.typeDossier, new Date());
    for (const dl of cesedaDeadlines) {
      await prisma.legalDeadline.create({
        data: {
          tenantId,
          dossierId: dossier.id,
          clientId: client?.id,
          type: dl.type,
          label: dl.label,
          dueDate: dl.dueDate,
          status: 'PENDING',
        },
      }).catch(() => {});
    }

    // 7. Trouver un template communautaire pertinent
    const suggestedTemplate = await prisma.communityTemplate.findFirst({
      where: {
        isPublic: true,
        typeDossier: summary.typeDossier || undefined,
      },
      orderBy: { upvotes: 'desc' },
      select: { id: true, title: true, category: true, upvotes: true },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      dossierId: dossier.id,
      numero: dossier.numero,
      clientId: client?.id,
      clientName: client?.nom,
      deadlinesCreated: cesedaDeadlines.length,
      suggestedTemplate,
    });
  } catch (error) {
    console.error('[EMAIL→DOSSIER] Error:', error);
    return NextResponse.json({ error: 'Erreur création dossier' }, { status: 500 });
  }
}

function parseDate(str: string): Date | null {
  // Try DD/MM/YYYY or DD-MM-YYYY
  const match = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    return new Date(year, parseInt(m) - 1, parseInt(d));
  }
  // Try natural date
  const natural = new Date(str);
  return isNaN(natural.getTime()) ? null : natural;
}

interface CesedaDeadline {
  type: string;
  label: string;
  dueDate: Date;
}

function getCesedaDeadlines(typeDossier: string, fromDate: Date): CesedaDeadline[] {
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

  const deadlines: Record<string, CesedaDeadline[]> = {
    OQTF: [
      { type: 'OQTF_DEPART', label: 'Délai de départ volontaire (30 jours)', dueDate: addDays(fromDate, 30) },
      { type: 'OQTF_RECOURS_TA', label: 'Recours TA contre OQTF (30 jours)', dueDate: addDays(fromDate, 30) },
    ],
    OQTF_SANS_DELAI: [
      { type: 'OQTF_48H', label: '⚠️ URGENT — Recours OQTF sans délai (48h)', dueDate: addDays(fromDate, 2) },
      { type: 'OQTF_REFERE_LIBERTE', label: '⚠️ URGENT — Référé-liberté (48h)', dueDate: addDays(fromDate, 2) },
    ],
    IRTF: [
      { type: 'IRTF_RECOURS', label: '⚠️ URGENT — Recours IRTF (48h si OQTF sans délai)', dueDate: addDays(fromDate, 2) },
    ],
    Asile: [
      { type: 'ASILE_OFPRA', label: 'Dépôt demande OFPRA (21 jours)', dueDate: addDays(fromDate, 21) },
      { type: 'ASILE_CNDA', label: 'Recours CNDA (1 mois)', dueDate: addDays(fromDate, 30) },
    ],
    Asile_accelere: [
      { type: 'ASILE_ACCEL_CNDA', label: '⚠️ URGENT — Recours CNDA procédure accélérée (15 jours)', dueDate: addDays(fromDate, 15) },
    ],
    TitreSejour: [
      { type: 'TS_RECOURS_GRACIEUX', label: 'Recours gracieux préfecture (2 mois)', dueDate: addDays(fromDate, 60) },
      { type: 'TS_RECOURS_TA', label: 'Recours TA (2 mois)', dueDate: addDays(fromDate, 60) },
    ],
    Naturalisation: [
      { type: 'NAT_RECOURS', label: 'Recours contre refus (2 mois)', dueDate: addDays(fromDate, 60) },
    ],
    AppelDecision: [
      { type: 'APPEL_CAA', label: 'Appel CAA (2 mois)', dueDate: addDays(fromDate, 60) },
    ],
    RegroupementFamilial: [
      { type: 'RF_RECOURS', label: 'Recours contre refus (2 mois)', dueDate: addDays(fromDate, 60) },
    ],
    Refere_suspension: [
      { type: 'REFERE_SUSP', label: '⚠️ URGENT — Référé-suspension (avant exécution)', dueDate: addDays(fromDate, 3) },
    ],
    Refere_liberte: [
      { type: 'REFERE_LIB', label: '⚠️ URGENT — Référé-liberté (48h)', dueDate: addDays(fromDate, 2) },
    ],
    Retention: [
      { type: 'RETENTION_JLD', label: '⚠️ URGENT — Saisine JLD rétention (48h)', dueDate: addDays(fromDate, 2) },
      { type: 'RETENTION_APPEL', label: '⚠️ URGENT — Appel ordonnance JLD (24h)', dueDate: addDays(fromDate, 1) },
    ],
  };

  return deadlines[typeDossier] || [];
}
