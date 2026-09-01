import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/emails?status=RECEIVED&limit=50
 * Liste les emails du tenant, filtrables par processingStatus.
 */
export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = (user as any).tenantId;
  const status = req.nextUrl.searchParams.get('status');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);

  const where: any = { tenantId };
  if (status) where.processingStatus = status;

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
      processingStatus: true,
      aiAnalysis: true,
      hasAttachments: true,
    },
  });

  return NextResponse.json({ emails, total: emails.length });
}




