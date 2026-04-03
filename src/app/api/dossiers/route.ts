import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { cacheThrough, cacheDelete, cacheInvalidatePattern } from '@/lib/cache';
import { logger } from '@/lib/logger';

function mapPrismaErrorToHttp(error: unknown): { status: number; message: string } | null {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : null;

  if (code === 'P2002') {
      return { status: 409, message: 'Conflit de donnees' };
  }
  if (code === 'P2025') {
      return { status: 404, message: 'Ressource non trouvee' };
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (session.user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = sessionTenantId;
    const dossierId = searchParams.get('id');
    const clientId = searchParams.get('clientId');
    const statut = searchParams.get('status') || searchParams.get('statut');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

    if (dossierId) {
      const dossier = await cacheThrough(
        `dossier:${tenantId}:${dossierId}`,
        async () => {
          return prisma.dossier.findFirst({
            where: { id: dossierId, tenantId },
            include: {
              client: true,
              documents: { take: 10, orderBy: { createdAt: 'desc' } },
              emails: { take: 10, orderBy: { receivedAt: 'desc' } },
              legalDeadlines: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' } },
              _count: { select: { documents: true, emails: true, legalDeadlines: true } },
            },
          });
        },
        'WARM'
      );

      if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
      return NextResponse.json({ dossier });
    }

    const cacheKey = `dossiers:${tenantId}:${clientId || 'all'}:${statut || 'all'}:${limit}:${offset}`;

    const result = await cacheThrough(
      cacheKey,
      async () => {
        const where: Record<string, unknown> = { tenantId };
        if (clientId) where.clientId = clientId;
        if (statut) where.statut = statut;

        const [dossiers, total] = await Promise.all([
          prisma.dossier.findMany({
            where,
            include: {
              client: { select: { firstName: true, lastName: true, email: true } },
              _count: { select: { documents: true, emails: true, legalDeadlines: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          prisma.dossier.count({ where }),
        ]);

        return { dossiers, total, hasMore: offset + dossiers.length < total };
      },
      'HOT'
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Erreur GET dossiers', error instanceof Error ? error : undefined, {
      route: '/api/dossiers',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (session.user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const {
      tenantId: _ignoredTenantId,
      clientId,
      objet,
      description,
      typeDossier,
      articleCeseda,
      categorieJuridique,
      juridiction,
      typeRecours,
      priorite,
    } = body;

    const tenantId = sessionTenantId;

    if (!clientId || !objet || !typeDossier) {
      return NextResponse.json(
        { error: 'clientId, objet et typeDossier requis' },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({ where: { id: clientId as string, tenantId } });
    if (!client) return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });

    const count = await prisma.dossier.count({ where: { tenantId } });
    const numero = `DOS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const dossier = await prisma.dossier.create({
      data: {
        tenantId,
        clientId: clientId as string,
        numero,
        objet: objet as string,
        description: description as string | undefined,
        typeDossier: typeDossier as string,
        articleCeseda: articleCeseda as string | undefined,
        categorieJuridique: categorieJuridique as string | undefined,
        juridiction: juridiction as string | undefined,
        typeRecours: typeRecours as string | undefined,
        priorite: (priorite as string) || 'normale',
      },
    });

    // Invalider le cache
    await cacheInvalidatePattern(`dossiers:${tenantId}:*`);

    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    const mapped = mapPrismaErrorToHttp(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    logger.error('Erreur POST dossier', error instanceof Error ? error : undefined, {
      route: '/api/dossiers',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (session.user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const {
      dossierId,
      tenantId: _ignoredTenantId,
      objet,
      description,
      statut,
      priorite,
      phase,
      juridiction,
      typeRecours,
      dateCloture,
    } = body;

    const tenantId = sessionTenantId;

    if (!dossierId)
      return NextResponse.json({ error: 'dossierId requis' }, { status: 400 });

    const existing = await prisma.dossier.findFirst({ where: { id: dossierId as string, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (objet !== undefined) updateData.objet = objet;
    if (description !== undefined) updateData.description = description;
    if (statut !== undefined) updateData.statut = statut;
    if (priorite !== undefined) updateData.priorite = priorite;
    if (phase !== undefined) updateData.phase = phase;
    if (juridiction !== undefined) updateData.juridiction = juridiction;
    if (typeRecours !== undefined) updateData.typeRecours = typeRecours;
    if (dateCloture !== undefined) {
      const parsed =
        typeof dateCloture === 'string' && dateCloture.trim().length > 0
          ? new Date(dateCloture)
          : null;
      if (parsed && isNaN(parsed.getTime()))
        return NextResponse.json({ error: 'Format dateCloture invalide' }, { status: 400 });
      updateData.dateCloture = parsed;
    }

    const dossier = await prisma.dossier.update({ where: { id: dossierId as string }, data: updateData });

    // Invalider le cache
    await Promise.all([
      cacheDelete(`dossier:${tenantId}:${dossierId}`),
      cacheInvalidatePattern(`dossiers:${tenantId}:*`),
    ]);

    return NextResponse.json({ success: true, dossier });
  } catch (error) {
    const mapped = mapPrismaErrorToHttp(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    logger.error('Erreur PATCH dossier', error instanceof Error ? error : undefined, {
      route: '/api/dossiers',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (session.user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dossierId = searchParams.get('id');
    const tenantId = sessionTenantId;

    if (!dossierId)
      return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const dossier = await prisma.dossier.findFirst({ where: { id: dossierId, tenantId } });
    if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

    await prisma.dossier.delete({ where: { id: dossierId } });

    // Invalider le cache
    await Promise.all([
      cacheDelete(`dossier:${tenantId}:${dossierId}`),
      cacheInvalidatePattern(`dossiers:${tenantId}:*`),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const mapped = mapPrismaErrorToHttp(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    logger.error('Erreur DELETE dossier', error instanceof Error ? error : undefined, {
      route: '/api/dossiers',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
