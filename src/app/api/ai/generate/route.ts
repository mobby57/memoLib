import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { logger } from '@/lib/logger';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const payloadSchema = z.object({ dossierId: z.string().min(1).optional() }).passthrough();
const serviceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const POST = withAIRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const user = session.user as { id?: string; tenantId?: string; role?: string; groups?: string[] };
    if (!user.id || !user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    const payload = payloadSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ error: 'Requête IA invalide' }, { status: 400 });
    if (payload.data.dossierId) {
      const access = await canAccessDossier({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        groups: user.groups,
        dossierId: payload.data.dossierId,
        action: 'read',
      });
      if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    }
    const response = await fetch(`${serviceUrl}/api/generation/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload.data),
    });
    if (!response.ok) return NextResponse.json({ error: 'Generation failed' }, { status: response.status });
    return NextResponse.json(await response.json());
  } catch (error) {
    logger.error('AI Generation error:', { error });
    return NextResponse.json({ error: 'Failed to connect to AI service' }, { status: 503 });
  }
});
