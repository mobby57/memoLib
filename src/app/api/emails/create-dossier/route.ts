import crypto from 'crypto';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
export async function POST(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });

  let requestBody: Record<string, unknown>;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requÃªte invalide. JSON attendu.' }, { status: 400 });
  }

  const { emailId, summary } = requestBody as { emailId?: string; summary?: any };
  if (!summary) return NextResponse.json({ error: 'summary requis' }, { status: 400 });

  try {
    // 1. CrÃ©er ou trouver le client
    let client: { id: string; firstName: string; lastName: string } | null = null;
    if (summary.client) {
      // Chercher par nom (firstName ou lastName contient le nom dÃ©tectÃ©)
      const clientName = summary.client.trim();
      client = await prisma.client.findFirst({
        where: { 
          tenantId, 
          OR: [
            { lastName: { contains: clientName, mode: 'insensitive' } },
            { firstName: { contains: clientName, mode: 'insensitive' } },
          ],
        },
        select: { id: true, firstName: true, lastName: true },
      });
      if (!client) {
        // Essayer de sÃ©parer prÃ©nom/nom
        const parts = clientName.split(' ');
        const firstName = parts.length > 1 ? parts[0] : clientName;
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : clientName;
        
        const created = await prisma.client.create({
          data: { 
            id: crypto.randomUUID(),
            tenantId, 
            firstName,
            lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@inconnu.fr`,
            status: 'prospect',
            updatedAt: new Date(),
          },
        });
        client = { id: created.id, firstName: created.firstName, lastName: created.lastName };
      }
    }

    // 2. GÃ©nÃ©rer numÃ©ro de dossier
    const count = await prisma.dossier.count({ where: { tenantId } });
    const numero = `D-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // 3. CrÃ©er le dossier
    const dossier = await prisma.dossier.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        numero,
        typeDossier: summary.typeDossier || 'GENERAL',
        objet: summary.objet || `Dossier ${summary.typeDossier}`,
        statut: 'en_cours',
        priorite: summary.urgence === 'critique' ? 'critique' : summary.urgence === 'haute' ? 'haute' : 'normale',
        clientId: client?.id || '',
        responsableId: user.id,
        description: summary.resumeCourt,
        updatedAt: new Date(),
      },
    });

    // 4. Lier l'email au dossier
    if (emailId) {
      await prisma.email.update({
        where: { id: emailId },
        data: { dossierId: dossier.id, clientId: client?.id },
      }).catch(() => {});
    }

    // 5. CrÃ©er deadline si dÃ©tectÃ©e
    if (summary.deadlineDetectee) {
      const parsed = parseDate(summary.deadlineDetectee);
      if (parsed) {
        await prisma.legalDeadline.create({
          data: {
            tenantId,
            dossierId: dossier.id,
            clientId: client?.id,
            type: 'CUSTOM',
            label: `Ã‰chÃ©ance dÃ©tectÃ©e par IA â€” ${summary.objet}`,
            dueDate: parsed,
            status: 'PENDING',
          },
        }).catch(() => {});
      }
    }

    // 6. Auto-crÃ©er les dÃ©lais CESEDA selon le type de dossier
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
      clientName: client ? `${client.firstName} ${client.lastName}` : undefined,
      deadlinesCreated: cesedaDeadlines.length,
      suggestedTemplate,
    });
  } catch (error) {
    console.error('[EMAILâ†’DOSSIER] Error:', error);
    return NextResponse.json({ error: 'Erreur crÃ©ation dossier' }, { status: 500 });
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
      { type: 'OQTF_DEPART', label: 'DÃ©lai de dÃ©part volontaire (30 jours)', dueDate: addDays(fromDate, 30) },
      { type: 'OQTF_RECOURS_TA', label: 'Recours TA contre OQTF (30 jours)', dueDate: addDays(fromDate, 30) },
    ],
    OQTF_SANS_DELAI: [
      { type: 'OQTF_48H', label: 'âš ï¸ URGENT â€” Recours OQTF sans dÃ©lai (48h)', dueDate: addDays(fromDate, 2) },
      { type: 'OQTF_REFERE_LIBERTE', label: 'âš ï¸ URGENT â€” RÃ©fÃ©rÃ©-libertÃ© (48h)', dueDate: addDays(fromDate, 2) },
    ],
    IRTF: [
      { type: 'IRTF_RECOURS', label: 'âš ï¸ URGENT â€” Recours IRTF (48h si OQTF sans dÃ©lai)', dueDate: addDays(fromDate, 2) },
    ],
    Asile: [
      { type: 'ASILE_OFPRA', label: 'DÃ©pÃ´t demande OFPRA (21 jours)', dueDate: addDays(fromDate, 21) },
      { type: 'ASILE_CNDA', label: 'Recours CNDA (1 mois)', dueDate: addDays(fromDate, 30) },
    ],
    Asile_accelere: [
      { type: 'ASILE_ACCEL_CNDA', label: 'âš ï¸ URGENT â€” Recours CNDA procÃ©dure accÃ©lÃ©rÃ©e (15 jours)', dueDate: addDays(fromDate, 15) },
    ],
    TitreSejour: [
      { type: 'TS_RECOURS_GRACIEUX', label: 'Recours gracieux prÃ©fecture (2 mois)', dueDate: addDays(fromDate, 60) },
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
      { type: 'REFERE_SUSP', label: 'âš ï¸ URGENT â€” RÃ©fÃ©rÃ©-suspension (avant exÃ©cution)', dueDate: addDays(fromDate, 3) },
    ],
    Refere_liberte: [
      { type: 'REFERE_LIB', label: 'âš ï¸ URGENT â€” RÃ©fÃ©rÃ©-libertÃ© (48h)', dueDate: addDays(fromDate, 2) },
    ],
    Retention: [
      { type: 'RETENTION_JLD', label: 'âš ï¸ URGENT â€” Saisine JLD rÃ©tention (48h)', dueDate: addDays(fromDate, 2) },
      { type: 'RETENTION_APPEL', label: 'âš ï¸ URGENT â€” Appel ordonnance JLD (24h)', dueDate: addDays(fromDate, 1) },
    ],
  };

  return deadlines[typeDossier] || [];
}

