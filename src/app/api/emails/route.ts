import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/emails?status=RECEIVED&limit=50
 * Liste les emails du tenant, filtrables par isProcessed.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (session.user as any).tenantId;
  const status = req.nextUrl.searchParams.get('status');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);

  const where: any = { tenantId };
  if (status) where.isProcessed = status;

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
