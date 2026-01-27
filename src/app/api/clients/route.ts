import { cacheDelete, cacheInvalidatePattern, cacheThrough, TTL_TIERS } from '@/lib/cache';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Liste des clients d'un tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const clientId = searchParams.get('id');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '100', 10) || 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10) || 0);

    // Recuperer un client specifique (avec cache)
    if (clientId) {
      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
      }

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
        TTL_TIERS.WARM // 5 min cache
      );

      if (!client) {
        return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });
      }
      return NextResponse.json({ client });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
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
      ? await cacheThrough(cacheKey, fetchClients, TTL_TIERS.HOT)
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
    const body = await request.json();
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

    if (!tenantId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'tenantId, firstName, lastName et email requis' },
        { status: 400 }
      );
    }

    // Verifier si le client existe deja
    const existing = await prisma.client.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Un client avec cet email existe deja' }, { status: 409 });
    }

    const parsedDate = dateOfBirth ? new Date(dateOfBirth) : null;
    if (parsedDate && isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Format dateOfBirth invalide' }, { status: 400 });
    }

    const [client] = await prisma.$transaction([
      prisma.client.create({
        data: {
          tenantId,
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
        where: { id: tenantId },
        data: { currentClients: { increment: 1 } },
      }),
    ]);

    // Invalider le cache des listes clients
    await cacheInvalidatePattern(`clients:${tenantId}:*`);

    return NextResponse.json({ success: true, client });
  } catch (error) {
    logger.error('Erreur POST client', error instanceof Error ? error : undefined, {
      route: '/api/clients',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre a jour un client
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
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
      const parsedDate = dateOfBirth ? new Date(dateOfBirth) : null;
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
    logger.error('Erreur DELETE client', error instanceof Error ? error : undefined, {
      route: '/api/clients',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
