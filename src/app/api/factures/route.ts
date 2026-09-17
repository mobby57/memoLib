import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { NotificationService } from '@/lib/notifications';
import prisma from '@/lib/prisma';

const internalRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'LAWYER', 'MANAGER']);
const invoiceStatuses = ['brouillon', 'envoyee', 'payee', 'annulee'] as const;

const CreateFactureSchema = z.object({
  clientId: z.string().min(1),
  dossierId: z.string().min(1).nullable().optional(),
  description: z.string().max(10_000).optional(),
  lignes: z.array(z.object({
    description: z.string().trim().min(1).max(1_000),
    quantite: z.number().positive().max(1_000).optional(),
    prixUnitaire: z.number().positive().max(1_000_000),
  })).min(1),
  tauxTVA: z.number().min(0).max(100).optional(),
  dateEcheance: z.coerce.date().optional(),
  notes: z.string().max(10_000).optional(),
  conditions: z.string().max(10_000).optional(),
  notifyUserId: z.string().min(1).optional(),
});

const UpdateFactureSchema = z.object({
  factureId: z.string().min(1),
  statut: z.enum(invoiceStatuses),
  datePaiement: z.coerce.date().optional(),
  modePaiement: z.string().max(100).optional(),
  referencePayment: z.string().max(255).optional(),
});

async function resolveAccess(requestedTenantId: string | null) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) };

  const role = user.role?.toUpperCase() ?? '';
  if (!user.id) return { error: NextResponse.json({ error: 'Session invalide' }, { status: 401 }) };
  if (role === 'SUPER_ADMIN' && requestedTenantId) {
    return { tenantId: requestedTenantId, userId: user.id, role };
  }
  if (!user.tenantId) return { error: NextResponse.json({ error: 'Tenant requis' }, { status: 403 }) };
  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    return { error: NextResponse.json({ error: 'Accès interdit' }, { status: 403 }) };
  }
  return { tenantId: user.tenantId, userId: user.id, role };
}

function canManageInvoices(role: string) {
  return internalRoles.has(role);
}

// GET - Liste des factures du tenant de la session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const access = await resolveAccess(searchParams.get('tenantId'));
    if ('error' in access) return access.error;
    if (!canManageInvoices(access.role)) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

    const clientId = searchParams.get('clientId');
    const dossierId = searchParams.get('dossierId');
    const statut = searchParams.get('statut');
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '50', 10) || 50));
    const offset = Math.max(0, Number.parseInt(searchParams.get('offset') ?? '0', 10) || 0);
    const where = {
      tenantId: access.tenantId,
      ...(clientId ? { clientId } : {}),
      ...(dossierId ? { dossierId } : {}),
      ...(statut && invoiceStatuses.includes(statut as (typeof invoiceStatuses)[number]) ? { statut } : {}),
    };

    const [factures, stats] = await Promise.all([
      prisma.facture.findMany({
        where,
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          dossier: { select: { numero: true, typeDossier: true } },
          lignes: true,
          paiements: true,
        },
        orderBy: { dateEmission: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.facture.groupBy({
        by: ['statut'],
        where: { tenantId: access.tenantId },
        _count: true,
        _sum: { montantTTC: true },
      }),
    ]);

    return NextResponse.json({ factures, stats });
  } catch (error) {
    logger.error('Erreur GET factures', error instanceof Error ? error : undefined, { route: '/api/factures' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Cree une facture avec ses lignes dans une transaction
export async function POST(request: NextRequest) {
  try {
    const access = await resolveAccess(null);
    if ('error' in access) return access.error;
    if (!canManageInvoices(access.role)) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

    const parsed = CreateFactureSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });
    const data = parsed.data;

    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId: access.tenantId },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });

    if (data.dossierId) {
      const dossier = await prisma.dossier.findFirst({
        where: { id: data.dossierId, clientId: data.clientId, tenantId: access.tenantId },
        select: { id: true },
      });
      if (!dossier) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
    }

    if (data.notifyUserId) {
      const recipient = await prisma.user.findFirst({
        where: { id: data.notifyUserId, tenantId: access.tenantId, status: 'active' },
        select: { id: true },
      });
      if (!recipient) return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 });
    }

    const montantHT = data.lignes.reduce((total, ligne) => total + (ligne.quantite ?? 1) * ligne.prixUnitaire, 0);
    const tauxTVA = data.tauxTVA ?? 20;
    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;
    const now = new Date();

    const facture = await prisma.$transaction(async (tx) => {
      const year = now.getFullYear();
      const lastFacture = await tx.facture.findFirst({
        where: { tenantId: access.tenantId, numero: { startsWith: `FAC-${year}-` } },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const lastNumber = lastFacture?.numero.match(/FAC-\d{4}-(\d+)/)?.[1];
      const numero = `FAC-${year}-${String((lastNumber ? Number.parseInt(lastNumber, 10) : 0) + 1).padStart(4, '0')}`;

      return tx.facture.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: access.tenantId,
          clientId: data.clientId,
          dossierId: data.dossierId,
          numero,
          description: data.description,
          montantHT,
          tauxTVA,
          montantTVA,
          montantTTC,
          dateEcheance: data.dateEcheance ?? new Date(now.getTime() + 30 * 86_400_000),
          notes: data.notes,
          conditions: data.conditions,
          statut: 'brouillon',
          updatedAt: now,
          lignes: {
            create: data.lignes.map((ligne, ordre) => {
              const quantite = ligne.quantite ?? 1;
              return {
                id: crypto.randomUUID(),
                description: ligne.description,
                quantite,
                prixUnitaire: ligne.prixUnitaire,
                montantHT: quantite * ligne.prixUnitaire,
                ordre,
              };
            }),
          },
        },
        include: { Client: true, LigneFacture: true },
      });
    });

    if (data.notifyUserId) {
      await NotificationService.factureCreated(data.notifyUserId, {
        numero: facture.numero,
        montant: facture.montantTTC,
        factureId: facture.id,
      });
    }

    return NextResponse.json({ success: true, facture }, { status: 201 });
  } catch (error) {
    logger.error('Erreur POST facture', error instanceof Error ? error : undefined, { route: '/api/factures' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Met a jour une facture appartenant au tenant de la session
export async function PATCH(request: NextRequest) {
  try {
    const access = await resolveAccess(null);
    if ('error' in access) return access.error;
    if (!canManageInvoices(access.role)) return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });

    const parsed = UpdateFactureSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });
    const existing = await prisma.facture.findFirst({
      where: { id: parsed.data.factureId, tenantId: access.tenantId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });

    const facture = await prisma.facture.update({
      where: { id: existing.id },
      data: {
        statut: parsed.data.statut,
        ...(parsed.data.statut === 'payee'
          ? {
              datePaiement: parsed.data.datePaiement ?? new Date(),
              modePaiement: parsed.data.modePaiement,
              referencePayment: parsed.data.referencePayment,
            }
          : {}),
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        dossier: { select: { typeDossier: true } },
      },
    });

    return NextResponse.json({ success: true, facture });
  } catch (error) {
    logger.error('Erreur PATCH facture', error instanceof Error ? error : undefined, { route: '/api/factures' });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




