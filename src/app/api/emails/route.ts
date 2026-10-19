import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/emails?status=PROCESSED|PENDING&limit=50
 * Liste les emails du tenant.
 */
export async function GET(req: NextRequest) {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (user as any).tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant missing' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);

  const where: any = { tenantId };
  if (status === 'PROCESSED') where.isProcessed = true;
  if (status === 'PENDING') where.isProcessed = false;

  const emails = await prisma.email.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      from: true,
      subject: true,
      body: true,
      category: true,
      urgency: true,
      receivedAt: true,
      isProcessed: true,
      aiAnalysis: true,
      hasAttachments: true,
    },
  });

  return NextResponse.json({ emails, total: emails.length });
}
