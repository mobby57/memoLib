import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/lawyer/workspaces - List workspaces (CESDA old + Reasoning new)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    const user = session.user as any
    const tenantId = user.tenantId
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 400 })
    }
    
    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'reasoning' // 'reasoning' | 'cesda'
    const state = searchParams.get('state')
    const locked = searchParams.get('locked')
    const search = searchParams.get('search')
    
    if (type === 'reasoning') {
      // Nouveau système WorkspaceReasoning
      const where: any = { tenantId }
      
      if (state && state !== 'ALL') {
        where.currentState = state
      }
      
      if (locked !== null) {
        where.locked = locked === 'true'
      }
      
      if (search) {
        where.OR = [
          { id: { contains: search } },
          { sourceRaw: { contains: search } },
          { procedureType: { contains: search } },
        ]
      }
      
      const workspaces = await prisma.workspaceReasoning.findMany({
        where,
        include: {
          facts: { take: 5 },
          missingElements: {
            where: { resolved: false },
            take: 5,
          },
          _count: {
            select: {
              facts: true,
              contexts: true,
              obligations: true,
              missingElements: true,
              risks: true,
              proposedActions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      
      return NextResponse.json({
        success: true,
        workspaces,
        count: workspaces.length,
        type: 'reasoning',
      })
    }
    
    // Ancien système Workspace CESDA (fallback)
    const oldWorkspaces = await prisma.workspace.findMany({
      where: { tenantId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            documents: true,
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    
    return NextResponse.json({
      success: true,
      workspaces: oldWorkspaces,
      count: oldWorkspaces.length,
      type: 'cesda',
    })
    
  } catch (error) {
    console.error('Erreur récupération workspaces:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/lawyer/workspaces - Create new workspace (REASONING or CESDA)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { role, tenantId, id: userId } = session.user as any

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const { type = 'reasoning' } = body
    
    if (type === 'reasoning') {
      // Nouveau système WorkspaceReasoning
      const { sourceType, sourceId, sourceRaw, sourceMetadata, procedureType, clientId, dossierId, emailId } = body
      
      if (!sourceType || !sourceRaw) {
        return NextResponse.json(
          { error: 'sourceType et sourceRaw requis' },
          { status: 400 }
        )
      }
      
      const workspace = await prisma.workspaceReasoning.create({
        data: {
          tenantId,
          currentState: 'RECEIVED',
          stateChangedAt: new Date(),
          stateChangedBy: userId,
          sourceType,
          sourceId,
          sourceRaw,
          sourceMetadata,
          procedureType,
          ownerUserId: userId,
          clientId,
          dossierId,
          emailId,
          uncertaintyLevel: 1.0,
          locked: false,
        },
      })
      
      await prisma.reasoningTransition.create({
        data: {
          workspaceId: workspace.id,
          fromState: 'RECEIVED',
          toState: 'RECEIVED',
          triggeredBy: 'SYSTEM',
          reason: 'Création initiale du workspace',
          metadata: JSON.stringify({ sourceType, procedureType }),
        },
      })
      
      return NextResponse.json({
        success: true,
        workspace,
        type: 'reasoning',
      })
    }
    
    // Ancien système Workspace CESDA
    const {
      title,
      description,
      procedureType,
      urgencyLevel,
      status,
      clientId,
      deadlineDate,
      notificationDate,
    } = body

    // Validation
    if (!title || !procedureType || !clientId) {
      return NextResponse.json(
        { error: 'Champs requis manquants: title, procedureType, clientId' },
        { status: 400 }
      )
    }

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé ou accès refusé' },
        { status: 404 }
      )
    }

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        tenantId,
        clientId,
        procedureType,
        title,
        description: description || null,
        urgencyLevel: urgencyLevel || 'moyen',
        status: status || 'active',
        deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
        notificationDate: notificationDate ? new Date(notificationDate) : null,
        createdById: userId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        checklist: true,
        documents: true,
        alerts: true,
      },
    })

    // Log action
    logger.info('Workspace created', {
      workspaceId: workspace.id,
      tenantId,
      userId,
      procedureType,
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error: any) {
    logger.error('Failed to create workspace', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du workspace' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
