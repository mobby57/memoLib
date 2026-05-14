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
        titre: summary.objet || `Dossier ${summary.typeDossier}`,
        type: summary.typeDossier || 'GENERAL',
        statut: 'OUVERT',
        priorite: summary.urgence === 'critique' ? 4 : summary.urgence === 'haute' ? 3 : 2,
        clientId: client?.id,
        avocatId: user.id,
        description: summary.resumeCourt,
        source: 'EMAIL_AI',
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

    return NextResponse.json({
      success: true,
      dossierId: dossier.id,
      numero: dossier.numero,
      clientId: client?.id,
      clientName: client?.nom,
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
