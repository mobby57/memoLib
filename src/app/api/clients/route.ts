import { cacheDelete, cacheInvalidatePattern, cacheThrough, TTL_TIERS } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/server-session';
import { NextRequest, NextResponse } from 'next/server';

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

// GET - Liste des clients d'un tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get('tenantId');
    const clientId = searchParams.get('id');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '100', 10) || 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

    const access = await resolveTenantAccess(requestedTenantId);
    if ('error' in access) {
      return access.error;
    }

    const tenantId = access.tenantId;

    // Recuperer un client specifique (avec cache)
    if (clientId) {
      const client = await cacheThrough(
        `client:${tenantId}:${clientId}`,
        async () => {
          return prisma.client.findFirst({
            where: { id: clientId, tenantId },
            include: {
              dossiers: true,
              emails: { take: 10, orderBy: { receivedAt: 'desc' } },
              factures: { take: 10, orderBy: { dateEmission: 'desc' } },
              _count: { select: { dossiers: true, emails: true, factures: true } },
            },
          });
        },
        'WARM'
      );

      if (!client) {
        return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });
      }
      return NextResponse.json({ client });
    }

    // Liste avec cache (seulement si pas de recherche)
    const cacheKey = search ? null : `clients:${tenantId}:${status || 'all'}:${limit}:${offset}`;

    const fetchClients = async () => {
      const where: Record<string, unknown> = search
        ? {
            AND: [
              { tenantId },
              ...(status ? [{ status }] : []),
              {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : { tenantId, ...(status && { status }) };

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
            _count: { select: { dossiers: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.client.count({ where }),
      ]);

      return { clients, total, hasMore: offset + clients.length < total };
    };

    const result = cacheKey
      ? await cacheThrough(cacheKey, fetchClients, 'HOT')
      : await fetchClients();

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Erreur GET clients', error instanceof Error ? error : undefined, {
      route: '/api/clients',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Creer un nouveau client
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const {
      tenantId,
      firstName,
      lastName,
      email,
      phone,
      address,
      codePostal,
      ville,
      dateOfBirth,
      nationality,
      civilite,
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'firstName, lastName et email requis' },
        { status: 400 }
      );
    }

    const access = await resolveTenantAccess((tenantId as string | null) || null);
    if ('error' in access) {
      return access.error;
    }
    const effectiveTenantId = access.tenantId;

    // Verifier si le client existe deja
    const existing = await prisma.client.findUnique({
      where: { tenantId_email: { tenantId: effectiveTenantId, email } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Un client avec cet email existe deja' }, { status: 409 });
    }

    const parsedDate =
      typeof dateOfBirth === 'string' && dateOfBirth.trim().length > 0
        ? new Date(dateOfBirth)
        : null;
    if (parsedDate && isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Format dateOfBirth invalide' }, { status: 400 });
    }

    const [client] = await prisma.$transaction([
      prisma.client.create({
        data: {
          tenantId: effectiveTenantId,
          firstName,
          lastName,
          email,
          phone,
          address,
          codePostal,
          ville,
          dateOfBirth: parsedDate,
          nationality,
          civilite,
        },
      }),
      prisma.tenant.update({
        where: { id: effectiveTenantId },
        data: { currentClients: { increment: 1 } },
      }),
    ]);

    // Invalider le cache des listes clients
    await cacheInvalidatePattern(`clients:${effectiveTenantId}:*`);

    return NextResponse.json({ success: true, client });
  } catch (error) {
    const mapped = mapPrismaErrorToHttp(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    logger.error('Erreur POST client', error instanceof Error ? error : undefined, {
      route: '/api/clients',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre a jour un client
export async function PATCH(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const {
      clientId,
      firstName,
      lastName,
      phone,
      address,
      codePostal,
      ville,
      dateOfBirth,
      nationality,
      civilite,
      status,
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
    }

    const existing = await prisma.client.findUnique({ where: { id: clientId } });
    if (!existing) {
      return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });
    }

    const access = await resolveTenantAccess(existing.tenantId);
    if ('error' in access) {
      return access.error;
    }

    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (codePostal !== undefined) updateData.codePostal = codePostal;
    if (ville !== undefined) updateData.ville = ville;
    if (nationality !== undefined) updateData.nationality = nationality;
    if (civilite !== undefined) updateData.civilite = civilite;
    if (status !== undefined) updateData.status = status;

    if (dateOfBirth !== undefined) {
      const parsedDate =
        typeof dateOfBirth === 'string' && dateOfBirth.trim().length > 0
          ? new Date(dateOfBirth)
          : null;
      if (parsedDate && isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Format dateOfBirth invalide' }, { status: 400 });
      }
      updateData.dateOfBirth = parsedDate;
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
    });

    // Invalider le cache du client et des listes
    await Promise.all([
      cacheDelete(`client:${existing.tenantId}:${clientId}`),
      cacheInvalidatePattern(`clients:${existing.tenantId}:*`),
    ]);

    return NextResponse.json({ success: true, client });
  } catch (error) {
    const mapped = mapPrismaErrorToHttp(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    logger.error('Erreur PATCH client', error instanceof Error ? error : undefined, {
      route: '/api/clients',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un client
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('id');

    if (!clientId) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { tenantId: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });
    }

    const access = await resolveTenantAccess(client.tenantId);
    if ('error' in access) {
      return access.error;
    }

    await prisma.$transaction([
      prisma.client.delete({ where: { id: clientId } }),
      prisma.tenant.update({
        where: { id: client.tenantId },
        data: { currentClients: { decrement: 1 } },
      }),
    ]);

    // Invalider le cache
    await Promise.all([
      cacheDelete(`client:${client.tenantId}:${clientId}`),
      cacheInvalidatePattern(`clients:${client.tenantId}:*`),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const mapped = mapPrismaErrorToHttp(error);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    logger.error('Erreur DELETE client', error instanceof Error ? error : undefined, {
      route: '/api/clients',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
