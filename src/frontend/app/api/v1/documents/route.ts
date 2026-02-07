import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/documents
 * List documents by dossier
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
    const dossierId = searchParams.get('dossierId');
    const category = searchParams.get('category');

    if (!dossierId) {
      return NextResponse.json(
        { error: 'Missing required query: dossierId' },
        { status: 400 }
      );
    }

    const where: any = {
      tenantId: user.tenantId,
      dossierId,
    };
    if (category) where.category = category;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error('[GET /api/v1/documents]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/documents
 * Create document record (file should be uploaded separately to S3)
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
    const { dossierId, title, fileUrl, mimeType, fileSize, category } = body;

    if (!dossierId || !title || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: dossierId, title, fileUrl' },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        tenantId: user.tenantId,
        dossierId,
        title,
        fileUrl,
        mimeType: mimeType || 'application/octet-stream',
        size: fileSize || 0,
        category: category || 'AUTRE',
        uploadedBy: user.id,
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
        entityType: 'document',
        entityId: document.id,
        newValue: JSON.stringify(document),
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('[POST /api/v1/documents]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
