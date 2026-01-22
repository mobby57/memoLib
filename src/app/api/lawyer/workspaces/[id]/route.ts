/**
 * API Route - Workspace Client Unifié
 * GET /api/lawyer/workspaces/[id] - Récupérer workspace complet
 * PATCH /api/lawyer/workspaces/[id] - Mettre à jour workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET - Récupérer workspace complet avec toutes les relations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const workspaceId = params.id;

    // Récupérer workspace avec toutes les relations
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            ville: true,
            nationality: true,
            dateOfBirth: true,
            situationFamiliale: true,
            profession: true,
            status: true,
          },
        },
        procedures: {
          orderBy: { createdAt: 'desc' },
          include: {
            checklist: true,
            documents: true,
            echeances: {
              where: { statut: { in: ['a_venir', 'proche', 'urgent'] } },
              orderBy: { dateEcheance: 'asc' },
            },
          },
        },
        emails: {
          orderBy: { receivedDate: 'desc' },
          take: 50,
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        timeline: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        notes: {
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        alerts: {
          where: { resolved: false },
          orderBy: [
            { level: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }

    // Vérifier accès tenant
    if (user.role !== 'SUPER_ADMIN' && workspace.tenantId !== user.tenantId) {
      logger.warn('Tentative accès workspace autre tenant', {
        userId: user.id,
        workspaceId,
        workspaceTenantId: workspace.tenantId,
        userTenantId: user.tenantId,
      });
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Calculer statistiques supplémentaires
    const stats = {
      emailsUnread: workspace.emails.filter(e => !e.isRead).length,
      emailsNeedResponse: workspace.emails.filter(e => e.needsResponse).length,
      proceduresCritiques: workspace.procedures.filter(p => p.urgencyLevel === 'critique').length,
      proceduresActives: workspace.procedures.filter(p => p.status === 'active').length,
      alertesCritiques: workspace.alerts.filter(a => a.level === 'critical').length,
      documentsNonVerifies: workspace.documents.filter(d => !d.verified).length,
    };

    // Logger l'accès
    logger.info('Workspace consulté', {
      userId: user.id,
      workspaceId,
      clientName: `${workspace.client.firstName} ${workspace.client.lastName}`,
      tenantId: workspace.tenantId,
    });

    return NextResponse.json({
      success: true,
      workspace,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Erreur récupération workspace', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const workspaceId = params.id;
    const body = await request.json();

    // Vérifier workspace existe et accès
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }

    if (user.role !== 'SUPER_ADMIN' && workspace.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Champs autorisés à la mise à jour
    const allowedFields = [
      'title',
      'description',
      'globalPriority',
      'primaryLawyerId',
      'teamMemberIds',
      'preferredChannel',
      'notificationsEnabled',
      'metadata',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.lastActivityDate = new Date();

    // Mettre à jour workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      include: {
        client: true,
      },
    });

    // Logger la modification
    logger.logActionDossier(
      'WORKSPACE_CHANGE',
      user.id,
      workspace.tenantId,
      workspaceId,
      {
        changes: Object.keys(updateData),
        clientId: workspace.clientId,
      }
    );

    return NextResponse.json({
      success: true,
      workspace: updatedWorkspace,
    });

  } catch (error) {
    logger.error('Erreur mise à jour workspace', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lawyer/workspaces/[id] - Archive workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const workspaceId = params.id;

    // Vérifier que le workspace existe et appartient au tenant
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }

    // Vérifier accès tenant
    if (user.role !== 'SUPER_ADMIN' && workspace.tenantId !== user.tenantId) {
      logger.warn('Tentative suppression workspace autre tenant', {
        userId: user.id,
        workspaceId,
        workspaceTenantId: workspace.tenantId,
        userTenantId: user.tenantId,
      });
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Soft delete - archive au lieu de supprimer
    const archivedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        status: 'archived',
        closedAt: new Date(),
      },
    });

    // Log action
    logger.logActionDossier(
      'DELETE_DOSSIER',
      user.id,
      workspace.tenantId,
      workspaceId,
      {
        clientId: workspace.clientId,
        procedureType: workspace.procedureType,
        archived: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Workspace archivé avec succès',
    });

  } catch (error) {
    logger.error('Erreur archivage workspace', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
