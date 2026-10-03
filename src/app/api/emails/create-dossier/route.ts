import { auth } from '@/lib/clerk-auth';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCesedaDeadlines } from '@/lib/legal/ceseda-deadlines';
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });

  let requestBody: Record<string, unknown>;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide. JSON attendu.' }, { status: 400 });
  }

  const { emailId, summary } = requestBody as { emailId?: string; summary?: any };
  if (!summary) return NextResponse.json({ error: 'summary requis' }, { status: 400 });

  try {
    // 1. Créer ou trouver le client
    let client: { id: string; firstName: string; lastName: string } | null = null;
    if (summary.client) {
      // Chercher par nom (firstName ou lastName contient le nom détecté)
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
        // Essayer de séparer prénom/nom
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

    // 2. Générer numéro de dossier
    const count = await prisma.dossier.count({ where: { tenantId } });
    const numero = `D-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // 3. Créer le dossier
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
      }).catch((err) => {
        console.error('[EMAIL→DOSSIER] Échec rattachement email au dossier:', err);
      });
    }

    // 5. Créer deadline si détectée
    if (summary.deadlineDetectee) {
      const parsed = parseDate(summary.deadlineDetectee);
      if (parsed) {
        await prisma.legalDeadline.create({
          data: {
            id: crypto.randomUUID(),
            tenantId,
            dossierId: dossier.id,
            clientId: client?.id || '',
            type: 'CUSTOM',
            label: `Échéance détectée par IA — ${summary.objet}`,
            referenceDate: new Date(),
            dueDate: parsed,
            status: 'PENDING',
            createdBy: user.id,
            updatedAt: new Date(),
          },
        });
      }
    }

    // 6. Auto-créer les délais CESEDA selon le type de dossier
    const now = new Date();
    const cesedaDeadlines = getCesedaDeadlines(summary.typeDossier, now);
    for (const dl of cesedaDeadlines) {
      await prisma.legalDeadline.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          dossierId: dossier.id,
          clientId: client?.id || '',
          type: dl.type,
          label: dl.label,
          referenceDate: now,
          dueDate: dl.dueDate,
          status: 'PENDING',
          createdBy: user.id,
          updatedAt: new Date(),
        },
      });
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





