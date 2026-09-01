import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/community-templates/[id]/vote
 * Vote +1 ou -1 sur un template. Un seul vote par utilisateur.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { id } = await params;
  const { vote } = await req.json();

  if (vote !== 1 && vote !== -1) {
    return NextResponse.json({ error: 'Vote doit être 1 ou -1' }, { status: 400 });
  }

  const template = await prisma.communityTemplate.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: 'Template non trouvé' }, { status: 404 });
  }

  // Upsert le vote
  const existing = await prisma.templateVote.findUnique({
    where: { templateId_userId: { templateId: id, userId: user.id } },
  });

  if (existing) {
    if (existing.vote === vote) {
      // Annuler le vote
      await prisma.templateVote.delete({ where: { id: existing.id } });
      await prisma.communityTemplate.update({
        where: { id },
        data: vote === 1 ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } },
      });
      return NextResponse.json({ success: true, action: 'removed' });
    }
    // Changer le vote
    await prisma.templateVote.update({ where: { id: existing.id }, data: { vote } });
    await prisma.communityTemplate.update({
      where: { id },
      data: vote === 1
        ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
        : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } },
    });
    return NextResponse.json({ success: true, action: 'changed' });
  }

  // Nouveau vote
  await prisma.templateVote.create({ data: { templateId: id, userId: user.id, vote } });
  await prisma.communityTemplate.update({
    where: { id },
    data: vote === 1 ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
  });

  return NextResponse.json({ success: true, action: 'voted' });
}
