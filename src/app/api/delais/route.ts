import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const delaiId = searchParams.get('id');
    const dossierId = searchParams.get('dossierId');
    const status = searchParams.get('status');
    const urgent = searchParams.get('urgent') === 'true';

    if (delaiId) {
      if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
      const delai = await prisma.delai.findFirst({
        where: { id: delaiId, tenantId },
        include: { dossier: { include: { client: true } } },
      });
      if (!delai) return NextResponse.json({ error: 'Delai non trouve' }, { status: 404 });
      return NextResponse.json({ delai });
    }

    if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

    const where: Record<string, unknown> = { tenantId };
    if (dossierId) where.dossierId = dossierId;
    if (status) where.status = status;
    if (urgent) where.dateEcheance = { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };

    const delais = await prisma.delai.findMany({
      where,
      include: { dossier: { select: { numero: true, titre: true, client: { select: { firstName: true, lastName: true } } } } },
      orderBy: { dateEcheance: 'asc' },
    });

    return NextResponse.json({ delais });
  } catch (error) {
    console.error('Erreur GET delais:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, dossierId, titre, description, type, fondementLegal, dateEcheance, priorite } = body;

    if (!tenantId || !dossierId || !titre || !type || !dateEcheance) {
      return NextResponse.json({ error: 'tenantId, dossierId, titre, type et dateEcheance requis' }, { status: 400 });
    }

    const dossier = await prisma.dossier.findFirst({ where: { id: dossierId, tenantId } });
    if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

    const echeance = new Date(dateEcheance);
    if (isNaN(echeance.getTime())) return NextResponse.json({ error: 'Format dateEcheance invalide' }, { status: 400 });

    const [delai] = await prisma.$transaction([
      prisma.delai.create({
        data: {
          tenantId,
          dossierId,
          titre,
          description,
          type,
          fondementLegal,
          dateEcheance: echeance,
          dateRappel1: new Date(echeance.getTime() - 7 * 24 * 60 * 60 * 1000),
          dateRappel2: new Date(echeance.getTime() - 3 * 24 * 60 * 60 * 1000),
          dateRappel3: new Date(echeance.getTime() - 1 * 24 * 60 * 60 * 1000),
          priorite: priorite || 'normale',
        },
      }),
      prisma.evenement.create({
        data: {
          tenantId,
          dossierId,
          type: 'delai',
          categorie: 'creation_echeance',
          titre: `Délai créé: ${titre}`,
          description: `Échéance: ${echeance.toLocaleDateString('fr-FR')}`,
          dateEvenement: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, delai });
  } catch (error) {
    console.error('Erreur POST delai:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { delaiId, tenantId, status, respecteLe } = body;

    if (!delaiId || !tenantId) return NextResponse.json({ error: 'delaiId et tenantId requis' }, { status: 400 });

    const existing = await prisma.delai.findFirst({ where: { id: delaiId, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Delai non trouve' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (respecteLe !== undefined) updateData.respecteLe = new Date(respecteLe);

    const delai = await prisma.delai.update({ where: { id: delaiId }, data: updateData });
    return NextResponse.json({ success: true, delai });
  } catch (error) {
    console.error('Erreur PATCH delai:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
