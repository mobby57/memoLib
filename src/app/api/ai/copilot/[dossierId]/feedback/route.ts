import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { recordFeedback } from '@/lib/ai/copilot/copilot-learning';

/**
 * POST /api/ai/copilot/[dossierId]/feedback
 * Enregistre une correction de l'avocat sur l'analyse Copilote
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { dossierId } = await params;
  const user = session.user as any;
  const { field, copilotValue, userValue, typeDossier } = await req.json();

  if (!field || userValue === undefined) {
    return NextResponse.json({ error: 'field et userValue requis' }, { status: 400 });
  }

  await recordFeedback({
    dossierId,
    userId: user.id,
    tenantId: user.tenantId,
    field,
    copilotValue: copilotValue || '',
    userValue: String(userValue),
    context: { typeDossier: typeDossier || '' },
    timestamp: new Date(),
  });

  return NextResponse.json({ success: true, message: 'Feedback enregistré. Le Copilote s\'améliore.' });
}
