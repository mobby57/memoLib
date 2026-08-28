// CLERK-MIGRATION: Remplacement session.user -> user (vérifier)
// CLERK-MIGRATION: Remplacement getServerSession() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (user as any).id;
  const tenantId = (user as any).tenantId || '';
  const { field, aiValue, userValue, context } = await request.json();

  if (!field || !aiValue || !userValue) {
    return NextResponse.json({ error: 'field, aiValue, userValue required' }, { status: 400 });
  }

  const feedback = await prisma.aIFeedback.create({
    data: { userId, tenantId, field, aiValue, userValue, context },
  });

  // Check if user corrects the same pattern 3+ times → suggest preference
  const count = await prisma.aIFeedback.count({
    where: { userId, field, aiValue, userValue },
  });

  return NextResponse.json({
    saved: true,
    suggestion: count >= 3 ? {
      message: `Vous corrigez souvent "${aiValue}" → "${userValue}" pour ${field}. Appliquer automatiquement ?`,
      field, fromValue: aiValue, toValue: userValue, occurrences: count,
    } : null,
  });
}




