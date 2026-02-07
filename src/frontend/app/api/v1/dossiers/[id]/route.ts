import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/dossiers/[id]
 * Get a single dossier
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const dossier = await prisma.dossier.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
      include: {
        client: true,
        documents: true,
        legalDeadlines: { orderBy: { dueDate: 'asc' } },
        emails: { take: 5, orderBy: { receivedAt: 'desc' } },
        factures: { orderBy: { dateEmission: 'desc' } },
      },
    });

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier not found' }, { status: 404 });
    }

    return NextResponse.json(dossier);
  } catch (error) {
    console.error('[GET /api/v1/dossiers/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/v1/dossiers/[id]
 * Update a dossier
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if dossier exists & belongs to tenant
    const existing = await prisma.dossier.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier not found' }, { status: 404 });
    }

    const body = await req.json();
    const { statut, priorite, description, dateEcheance } = body;

    const updated = await prisma.dossier.update({
      where: { id: params.id },
      data: {
        statut: statut || existing.statut,
        priorite: priorite || existing.priorite,
        description: description || existing.description,
        dateEcheance: dateEcheance ? new Date(dateEcheance) : existing.dateEcheance,
        updatedAt: new Date(),
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
        action: 'UPDATE',
        entityType: 'dossier',
        entityId: params.id,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(updated),
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PUT /api/v1/dossiers/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/dossiers/[id]
 * Soft delete a dossier
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check existence
    const existing = await prisma.dossier.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dossier not found' }, { status: 404 });
    }

    // Soft delete
    const deleted = await prisma.dossier.update({
      where: { id: params.id },
      data: { dateCloture: new Date() }, // Mark as closed
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'DELETE',
        entityType: 'dossier',
        entityId: params.id,
        oldValue: JSON.stringify(existing),
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json({ message: 'Dossier closed successfully' });
  } catch (error) {
    console.error('[DELETE /api/v1/dossiers/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
