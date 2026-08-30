import crypto from 'crypto';
/**
 * PUT /api/drafts/[id]/validate — Valide un draft → crée dossier + deadline auto
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { mapValidatedDraftToDossier } from '@/lib/mappers/draft.mapper';
import { DossierService } from '@/lib/services/dossier.service';
import { createAutoDeadline } from '@/lib/services/deadline-auto.service';
import type { ValidateDraftPayload } from '@/types/draft.types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const tenantId = (session.user as any).tenantId;
    const userId = (session.user as any).id;
    if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

    const { id } = await params;
    const draft = await prisma.draft.findFirst({ where: { id, tenantId, status: 'PENDING' } });
    if (!draft) return NextResponse.json({ error: 'Draft non trouvé ou déjà traité' }, { status: 404 });

    const body: ValidateDraftPayload = await request.json();
    if (!body.clientName || !body.clientEmail || !body.caseType) {
      return NextResponse.json({ error: 'clientName, clientEmail et caseType requis' }, { status: 400 });
    }

    const extractedData = JSON.parse(draft.extractedData);

    // 1. Trouver ou créer le client
    let client = await prisma.client.findFirst({
      where: { tenantId, email: body.clientEmail.toLowerCase() },
    });
    if (!client) {
      const nameParts = body.clientName.split(' ');
      client = await prisma.client.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          firstName: nameParts[0] || 'Client',
          lastName: nameParts.slice(1).join(' ') || body.clientName,
          email: body.clientEmail.toLowerCase(),
          phone: body.clientPhone || null,
          status: 'actif',
          updatedAt: new Date(),
        },
      });
    }

    // 2. Créer le dossier
    const dossierData = mapValidatedDraftToDossier(extractedData, body, client.id);
    const dossier = await DossierService.createDossier(dossierData, tenantId);

    // 3. Créer la deadline automatique (Sprint 2)
    let deadline: { id: string; dueDate: Date } | null = null;
    try {
      deadline = await createAutoDeadline({
        dossierId: dossier.id,
        tenantId,
        clientId: client.id,
        typeDossier: body.caseType,
        caseSubType: body.caseSubType,
        notificationDate: body.notificationDate ? new Date(body.notificationDate) : undefined,
        createdBy: userId,
      });
    } catch (dlErr) {
      console.error('[DRAFTS] Auto-deadline best-effort failed:', dlErr);
    }

    // 4. Mettre à jour le draft
    await prisma.draft.update({
      where: { id },
      data: { status: 'VALIDATED', validatedBy: userId, validatedAt: new Date(), createdDossierId: dossier.id },
    });

    // 5. Lier l'email source au dossier
    if (draft.sourceEmailId) {
      await prisma.email.update({
        where: { id: draft.sourceEmailId },
        data: { dossierId: dossier.id, clientId: client.id },
      }).catch(() => {});
    }

    // 6. Créer notification in-app
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'dossier_created',
          title: `Dossier ${dossier.numero} créé`,
          message: `Dossier ${body.caseType} créé pour ${body.clientName}${deadline ? ` — échéance le ${new Date(deadline.dueDate).toLocaleDateString('fr-FR')}` : ''}`,
          priority: body.urgency === 'critical' ? 'high' : 'normal',
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      dossierId: dossier.id,
      clientId: client.id,
      deadlineId: deadline?.id || null,
      message: 'Draft validé, dossier créé',
    });
  } catch (error) {
    console.error('[DRAFTS] Validate error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
