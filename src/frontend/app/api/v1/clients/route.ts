import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/clients
 * List all clients for tenant
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { tenantId: user.tenantId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: { dossiers: { select: { id: true, numero: true, statut: true } } },
        skip,
        take: limit,
        orderBy: { lastName: 'asc' },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      data: clients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/v1/clients]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/clients
 * Create a new client
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, address, codePostal, ville } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
        { status: 400 }
      );
    }

    // Check if client already exists
    const existing = await prisma.client.findFirst({
      where: { tenantId: user.tenantId, email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Client with this email already exists' }, { status: 409 });
    }

    const client = await prisma.client.create({
      data: {
        tenantId: user.tenantId,
        firstName,
        lastName,
        email,
        phone: phone || null,
        address: address || null,
        codePostal: codePostal || null,
        ville: ville || null,
        status: 'actif',
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'CREATE',
        entityType: 'client',
        entityId: client.id,
        newValue: JSON.stringify(client),
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('[POST /api/v1/clients]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
