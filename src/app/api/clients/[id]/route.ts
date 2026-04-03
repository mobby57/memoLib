import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cacheThrough, cacheDelete } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from '@/lib/auth/server-session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function resolveTenantAccess(requestedTenantId: string | null): Promise<
  | { tenantId: string; role: string }
  | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Non authentifie' }, { status: 401 }) };
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const sessionTenantId = (session.user as any).tenantId as string | undefined;

  if (role === 'SUPER_ADMIN') {
    if (!requestedTenantId) {
      return { error: NextResponse.json({ error: 'tenantId requis' }, { status: 400 }) };
    }
    return { tenantId: requestedTenantId, role };
  }

  if (!sessionTenantId) {
    return { error: NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 }) };
  }

  if (requestedTenantId && requestedTenantId !== sessionTenantId) {
    return { error: NextResponse.json({ error: 'Acces interdit' }, { status: 403 }) };
  }

  return { tenantId: sessionTenantId, role };
}

/**
 * GET /api/clients/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const includeDossiers = searchParams.get('includeDossiers') !== 'false';
    const includeFactures = searchParams.get('includeFactures') !== 'false';

    const access = await resolveTenantAccess(requestedTenantId);
    if ('error' in access) return access.error;
    const { tenantId } = access;

    const cacheKey = `client:${tenantId}:${clientId}:full`;

    const client = await cacheThrough(
      cacheKey,
      async () => {
        return prisma.client.findFirst({
          where: { id: clientId, tenantId },
          include: {
            dossiers: includeDossiers
              ? {
                  orderBy: { createdAt: 'desc' },
                  take: 20,
                  select: {
                    id: true,
                    numero: true,
                    objet: true,
                    typeDossier: true,
                    statut: true,
                    priorite: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                }
              : false,
            factures: includeFactures
              ? {
                  orderBy: { dateEmission: 'desc' },
                  take: 20,
                  select: {
                    id: true,
                    numero: true,
                    montantHT: true,
                    montantTTC: true,
                    statut: true,
                    dateEmission: true,
                    dateEcheance: true,
                  },
                }
              : false,
            _count: {
              select: {
                dossiers: true,
                factures: true,
                documents: true,
                emails: true,
              },
            },
          },
        });
      },
      'WARM'
    );

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const stats = {
      totalDossiers: (client as any)._count.dossiers,
      totalFactures: (client as any)._count.factures,
      totalDocuments: (client as any)._count.documents,
      totalEmails: (client as any)._count.emails,
    };

    return NextResponse.json({ client, stats });
  } catch (error) {
    logger.error('Erreur GET client', error instanceof Error ? error : undefined, {
      route: '/api/clients/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/clients/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const body = await request.json();
    const { tenantId: requestedTenantId, ...updateData } = body;

    const access = await resolveTenantAccess(requestedTenantId ?? null);
    if ('error' in access) return access.error;
    const { tenantId } = access;

    const existing = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
    });

    await cacheDelete(`client:${tenantId}:${clientId}:full`);

    return NextResponse.json({ client, message: 'Client mis à jour' });
  } catch (error) {
    logger.error('Erreur PATCH client', error instanceof Error ? error : undefined, {
      route: '/api/clients/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const hardDelete = searchParams.get('hard') === 'true';

    const access = await resolveTenantAccess(requestedTenantId);
    if ('error' in access) return access.error;
    const { tenantId, role } = access;

    if (hardDelete && !new Set(['ADMIN', 'SUPER_ADMIN']).has(role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
    }

    const existing = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        _count: { select: { dossiers: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
    }

    if (existing._count.dossiers > 0 && hardDelete) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un client avec des dossiers actifs' },
        { status: 400 }
      );
    }

    if (hardDelete) {
      await prisma.client.delete({
        where: { id: clientId },
      });
    } else {
      await prisma.client.update({
        where: { id: clientId },
        data: { status: 'inactive' },
      });
    }

    await cacheDelete(`client:${tenantId}:${clientId}:full`);

    return NextResponse.json({
      message: hardDelete ? 'Client supprimé définitivement' : 'Client désactivé',
      deleted: hardDelete,
      deactivated: !hardDelete,
    });
  } catch (error) {
    logger.error('Erreur DELETE client', error instanceof Error ? error : undefined, {
      route: '/api/clients/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
