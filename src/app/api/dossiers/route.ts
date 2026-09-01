import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cacheThrough, cacheDelete, cacheInvalidatePattern } from '@/lib/cache';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { validateQuery } from '@/lib/validation/request-validator';
import { logger } from '@/lib/logger';
import { canAccessDossier } from '@/lib/auth/dossier-access';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const createDossierSchema = z.object({
  clientId: z.string().uuid(),
  titre: z.string().min(1).max(500),
  type: z.string().min(1),
  description: z.string().optional(),
  domaine: z.string().optional(),
  juridiction: z.string().optional(),
  numeroRG: z.string().optional(),
  priorite: z.enum(['basse', 'normale', 'haute', 'urgente']).optional(),
});

const patchDossierSchema = z.object({
  dossierId: z.string().min(1),
  titre: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priorite: z.enum(['basse', 'normale', 'haute', 'urgente']).optional(),
  juridiction: z.string().optional(),
  numeroRG: z.string().optional(),
  dateCloture: z.string().optional().nullable(),
});

const listDossiersQuerySchema = z.object({
  id: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  status: z.string().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const deleteDossierQuerySchema = z.object({
  id: z.string().uuid('id invalide'),
});

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
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = validateQuery<z.infer<typeof listDossiersQuerySchema>>(
      Object.fromEntries(searchParams.entries()),
      listDossiersQuerySchema
    );
    if (!queryValidation.valid) {
      return queryValidation.response;
    }

    const tenantId = sessionTenantId;
    const { id: dossierId, clientId, status, limit, offset } = queryValidation.data;

    if (dossierId) {
      const dossier = await cacheThrough(
        `dossier:${tenantId}:${dossierId}`,
        async () => {
          return prisma.dossier.findFirst({
            where: { id: dossierId, tenantId },
            include: {
              client: true,
              documents: { take: 10, orderBy: { createdAt: 'desc' } },
              legalDeadlines: { orderBy: { dueDate: 'asc' }, take: 10 },
              emails: { take: 10, orderBy: { createdAt: 'desc' } },
            },
          });
        },
        'WARM'
      );

      if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
      return NextResponse.json({ dossier });
    }

    const cacheKey = `dossiers:${tenantId}:${clientId || 'all'}:${status || 'all'}:${limit}:${offset}`;

    const result = await cacheThrough(
      cacheKey,
      async () => {
        const where: Record<string, unknown> = { tenantId };
        if (clientId) where.clientId = clientId;
        if (status) where.status = status;

        const [dossiers, total] = await Promise.all([
          prisma.dossier.findMany({
            where,
            include: {
              Client: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          prisma.dossier.count({ where }),
        ]);

        // Mapper pour compatibilité frontend
        const mapped = dossiers.map((d: any) => ({
          ...d,
          client: d.Client ? { firstName: d.Client.firstName, lastName: d.Client.lastName, email: d.Client.email } : null,
        }));

        return { dossiers: mapped, total, hasMore: offset + dossiers.length < total };
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
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parsed = createDossierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { clientId, titre, type, description, domaine, juridiction, numeroRG, priorite } = parsed.data;
    const tenantId = sessionTenantId;

    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });

    const count = await prisma.dossier.count({ where: { tenantId } });
    const numero = `DOS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const dossier = await prisma.dossier.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        clientId,
        numero,
        objet: titre || description || 'Nouveau dossier',
        typeDossier: type || 'GENERAL',
        description,
        juridiction,
        priorite: priorite || 'normale',
        statut: 'en_cours',
        updatedAt: new Date(),
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
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parsed = patchDossierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      dossierId,
      titre,
      description,
      status,
      priorite,
      juridiction,
      numeroRG,
      dateCloture,
    } = parsed.data;

    const tenantId = sessionTenantId;

    const existing = await prisma.dossier.findFirst({ where: { id: dossierId, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

    const access = await canAccessDossier({
      userId: (user as any).id,
      tenantId,
      role: (user as any).role,
      groups: (user as any).groups,
      dossierId,
      action: 'write',
    });
    if (!access.allowed) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (titre !== undefined) updateData.titre = titre;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priorite !== undefined) updateData.priorite = priorite;
    if (juridiction !== undefined) updateData.juridiction = juridiction;
    if (numeroRG !== undefined) updateData.numeroRG = numeroRG;
    if (dateCloture !== undefined) {
      const parsedDate =
        typeof dateCloture === 'string' && dateCloture.trim().length > 0
          ? new Date(dateCloture)
          : null;
      if (parsedDate && isNaN(parsedDate.getTime()))
        return NextResponse.json({ error: 'Format dateCloture invalide' }, { status: 400 });
      updateData.dateCloture = parsedDate;
    }

    const dossier = await prisma.dossier.update({ where: { id: dossierId }, data: updateData });

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
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = validateQuery<z.infer<typeof deleteDossierQuerySchema>>(
      Object.fromEntries(searchParams.entries()),
      deleteDossierQuerySchema
    );
    if (!queryValidation.valid) {
      return queryValidation.response;
    }

    const { id: dossierId } = queryValidation.data;
    const tenantId = sessionTenantId;

    const dossier = await prisma.dossier.findFirst({ where: { id: dossierId, tenantId } });
    if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

    const access = await canAccessDossier({
      userId: (user as any).id,
      tenantId,
      role: (user as any).role,
      groups: (user as any).groups,
      dossierId,
      action: 'manage',
    });
    if (!access.allowed) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

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




