// @ts-nocheck
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import prisma from '@/lib/prisma';
import { cacheThrough, cacheDelete, cacheInvalidatePattern } from '@/lib/cache';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { validateQuery } from '@/lib/validation/request-validator';
import { logger } from '@/lib/logger';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const createDossierSchema = z.object({
  // Format A — API stricte (page liste, tests)
  clientId: z.string().uuid().optional(),
  titre: z.string().min(1).max(500).optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional(),
  domaine: z.string().optional(),
  juridiction: z.string().optional(),
  numeroRG: z.string().optional(),
  priorite: z.enum(['basse', 'normale', 'haute', 'urgente']).optional(),
  // Format B — Wizard avancé
  typeDossier: z.string().min(1).optional(),
  objetDemande: z.string().min(1).optional(),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  adresse: z.string().optional(),
  // Format C — Page rapide
  clientName: z.string().min(1).optional(),
  objet: z.string().min(1).optional(),
  dateEcheance: z.string().optional(),
}).passthrough();

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
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (session.user as any).tenantId as string | undefined;
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

        // Mapper pour compatibilitÃ© frontend
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
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (session.user as any).tenantId as string | undefined;
    if (!sessionTenantId) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
    const sessionUserId = (session.user as any).id as string;
    const tenantId = sessionTenantId;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parsed = createDossierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const d = parsed.data;

    // ─── Detection du format ───
    const isFormatA = Boolean(d.clientId && d.titre && d.type);
    const isFormatB = Boolean(!isFormatA && d.typeDossier && d.objetDemande);
    const isFormatC = Boolean(!isFormatA && !isFormatB && d.clientName && d.typeDossier && d.objet);

    if (!isFormatA && !isFormatB && !isFormatC) {
      return NextResponse.json(
        { error: 'Format non reconnu. Champs requis : (clientId+titre+type) | (typeDossier+objetDemande) | (clientName+typeDossier+objet)' },
        { status: 400 }
      );
    }
    if (isFormatC && !d.email) {
      return NextResponse.json({ error: 'Email client requis pour ce format' }, { status: 400 });
    }

    // ─── Resolution du clientId + champs dossier ───
    let clientId: string;
    let clientNom: string | null = null;
    let clientPrenom: string | null = null;
    let clientAdresse: string | null = null;
    let objetDossier: string;
    let typeDossier: string;
    let description: string | undefined;
    let juridiction: string | undefined;
    let numeroRG: string | undefined;
    let priorite: string | undefined;

    if (isFormatA) {
      const client = await prisma.client.findFirst({ where: { id: d.clientId!, tenantId } });
      if (!client) return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });
      clientId = d.clientId!;
      objetDossier = d.titre!;
      typeDossier = d.type!;
      description = d.description;
      juridiction = d.juridiction;
      numeroRG = d.numeroRG;
      priorite = d.priorite;
    } else if (isFormatB) {
      if (!d.email) {
        return NextResponse.json({ error: 'Email client requis pour ce format' }, { status: 400 });
      }
      let client = await prisma.client.findFirst({ where: { email: d.email, tenantId } });
      if (!client) {
        client = await prisma.client.create({
          data: {
            id: crypto.randomUUID(),
            email: d.email,
            firstName: d.prenom || 'À renseigner',
            lastName: d.nom || 'À renseigner',
            tenantId,
            updatedAt: new Date(),
          },
        });
      }
      clientId = client.id;
      objetDossier = d.objetDemande!;
      typeDossier = d.typeDossier!;
      clientNom = d.nom ?? null;
      clientPrenom = d.prenom ?? null;
      clientAdresse = d.adresse ?? null;
    } else {
      // Format C — page rapide
      const email = d.email!;
      let client = await prisma.client.findFirst({ where: { email, tenantId } });
      if (!client) {
        client = await prisma.client.create({
          data: {
            id: crypto.randomUUID(),
            email,
            firstName: 'À renseigner',
            lastName: d.clientName!,
            tenantId,
            updatedAt: new Date(),
          },
        });
      }
      clientId = client.id;
      objetDossier = d.objet!;
      typeDossier = d.typeDossier!;
      clientNom = d.clientName!;
    }

    // ─── Numero sequentiel DOS-YYYY-NNNN ───
    const count = await prisma.dossier.count({ where: { tenantId } });
    const numero = `DOS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // ─── Creation ───
    const dossier = await prisma.dossier.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        clientId,
        numero,
        objet: objetDossier,
        typeDossier,
        description,
        juridiction,
        numeroJuridiction: numeroRG,
        priorite: priorite || 'normale',
        statut: 'en_cours',
        responsableId: sessionUserId,
        clientNom,
        clientPrenom,
        clientAdresse,
        updatedAt: new Date(),
      },
    });

    await cacheInvalidatePattern(`dossiers:${tenantId}:*`);

    // Retour compatible avec les 3 appelants :
    // - wizard lit dossier.id
    // - page liste ne lit rien
    // - page rapide ne lit rien
    return NextResponse.json({
      success: true,
      dossier,
      id: dossier.id,
      dossierId: dossier.id,
    });
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
    const session = await getServerSessionCompat();
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

    const parsed = patchDossierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'DonnÃ©es invalides', details: parsed.error.flatten().fieldErrors },
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
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    const sessionTenantId = (session.user as any).tenantId as string | undefined;
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

