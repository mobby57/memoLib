import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const dossierId = searchParams.get('id');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

    if (dossierId) {
      if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
      const dossier = await prisma.dossier.findFirst({
        where: { id: dossierId, tenantId },
        include: {
          client: true,
          documents: { take: 10, orderBy: { createdAt: 'desc' } },
          delais: { where: { status: 'actif' }, orderBy: { dateEcheance: 'asc' } },
          evenements: { take: 20, orderBy: { dateEvenement: 'desc' } },
          _count: { select: { documents: true, delais: true, evenements: true } },
        },
      });
      if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
      return NextResponse.json({ dossier });
    }

    if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

    const where: Record<string, unknown> = { tenantId };
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const [dossiers, total] = await Promise.all([
      prisma.dossier.findMany({
        where,
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { documents: true, delais: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.dossier.count({ where }),
    ]);

    return NextResponse.json({ dossiers, total, hasMore: offset + dossiers.length < total });
  } catch (error) {
    console.error('Erreur GET dossiers:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, clientId, titre, description, type, domaine, juridiction, numeroRG, priorite } = body;

    if (!tenantId || !clientId || !titre || !type) {
      return NextResponse.json({ error: 'tenantId, clientId, titre et type requis' }, { status: 400 });
    }

    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });

    const count = await prisma.dossier.count({ where: { tenantId } });
    const numero = `DOS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const [dossier] = await prisma.$transaction([
      prisma.dossier.create({
        data: { tenantId, clientId, numero, titre, description, type, domaine, juridiction, numeroRG, priorite: priorite || 'normale' },
      }),
      prisma.evenement.create({
        data: {
          tenantId,
          clientId,
          type: 'action',
          categorie: 'ouverture_dossier',
          titre: 'Ouverture du dossier',
          description: `Dossier ${numero} créé`,
          dateEvenement: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    console.error('Erreur POST dossier:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { dossierId, tenantId, titre, description, status, priorite, juridiction, numeroRG, dateCloture } = body;

    if (!dossierId || !tenantId) return NextResponse.json({ error: 'dossierId et tenantId requis' }, { status: 400 });

    const existing = await prisma.dossier.findFirst({ where: { id: dossierId, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (titre !== undefined) updateData.titre = titre;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priorite !== undefined) updateData.priorite = priorite;
    if (juridiction !== undefined) updateData.juridiction = juridiction;
    if (numeroRG !== undefined) updateData.numeroRG = numeroRG;
    if (dateCloture !== undefined) {
      const parsed = dateCloture ? new Date(dateCloture) : null;
      if (parsed && isNaN(parsed.getTime())) return NextResponse.json({ error: 'Format dateCloture invalide' }, { status: 400 });
      updateData.dateCloture = parsed;
    }

    const dossier = await prisma.dossier.update({ where: { id: dossierId }, data: updateData });
    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    console.error('Erreur PATCH dossier:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dossierId = searchParams.get('id');
    const tenantId = searchParams.get('tenantId');

    if (!dossierId || !tenantId) return NextResponse.json({ error: 'id et tenantId requis' }, { status: 400 });

    const dossier = await prisma.dossier.findFirst({ where: { id: dossierId, tenantId } });
    if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

    await prisma.dossier.delete({ where: { id: dossierId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE dossier:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
