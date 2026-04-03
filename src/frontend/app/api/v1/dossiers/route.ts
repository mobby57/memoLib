import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/server-session';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/dossiers
 * List all dossiers for current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guard = requireApiPermission(session, RBAC_PERMISSIONS.DOSSIERS_READ);
    if (!guard.ok) {
      return guard.response;
    }

    // Get user & tenant
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tenant: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const statut = searchParams.get('statut');
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'dateCreation';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase();

    const skip = (page - 1) * limit;

    // Build filter
    const where: any = { tenantId: user.tenantId };
    if (statut) where.statut = statut;
    if (clientId) where.clientId = clientId;

    const allowedSortBy = ['dateCreation', 'updatedAt', 'priorite', 'statut'] as const;
    const normalizedSortBy = allowedSortBy.includes(sortBy as (typeof allowedSortBy)[number])
      ? (sortBy as (typeof allowedSortBy)[number])
      : 'dateCreation';
    const normalizedSortOrder: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';

    // Fetch dossiers
    const [dossiers, total] = await Promise.all([
      prisma.dossier.findMany({
        where,
        include: { client: true, legalDeadlines: { take: 1, orderBy: { dueDate: 'asc' } } },
        skip,
        take: limit,
        orderBy: { [normalizedSortBy]: normalizedSortOrder },
      }),
      prisma.dossier.count({ where }),
    ]);

    return NextResponse.json({
      data: dossiers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/v1/dossiers]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/dossiers
 * Create a new dossier
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guard = requireApiPermission(session, RBAC_PERMISSIONS.DOSSIERS_MANAGE);
    if (!guard.ok) {
      return guard.response;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tenant: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const body = await req.json();
    const { numero, clientId, typeDossier, dateEcheance, description, priorite } = body;

    // Validate required fields
    if (!numero || !clientId || !typeDossier) {
      return NextResponse.json(
        { error: 'Missing required fields: numero, clientId, typeDossier' },
        { status: 400 }
      );
    }

    // Check if client exists & belongs to tenant
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId: user.tenantId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create dossier
    const dossier = await prisma.dossier.create({
      data: {
        tenantId: user.tenantId,
        numero,
        clientId,
        typeDossier,
        dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
        description,
        priorite: priorite || 'normale',
        statut: 'en_cours',
        dateCreation: new Date(),
        dateOuverture: new Date(),
      },
      include: { client: true },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'CREATE',
        entityType: 'dossier',
        entityId: dossier.id,
        newValue: JSON.stringify(dossier),
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json(dossier, { status: 201 });
  } catch (error) {
    console.error('[POST /api/v1/dossiers]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
