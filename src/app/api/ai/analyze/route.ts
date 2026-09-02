import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { sanitizePromptForAI, sanitizeStructuredDataForAI } from '@/lib/ai/prompt-sanitizer';
import { logger } from '@/lib/logger';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const payloadSchema = z.object({
  dossierId: z.string().trim().min(1).max(128).optional(),
  prompt: z.string().trim().min(1).max(12_000).optional(),
  context: z.record(z.unknown()).optional(),
}).strict().refine(
  ({ dossierId, prompt, context }) => dossierId !== undefined || prompt !== undefined || context !== undefined,
  { message: 'Au moins un champ d’analyse est requis' }
);
const serviceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const POST = withAIRateLimit(async (request: NextRequest) => {
  try {
    const { user } = await auth();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    if (!user || !user.id || !user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    const payload = payloadSchema.safeParse(await request.json().catch(() => null));
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
    const safePayload = {
      ...payload.data,
      prompt: payload.data.prompt ? sanitizePromptForAI(payload.data.prompt).sanitizedText : undefined,
      context: payload.data.context ? sanitizeStructuredDataForAI(payload.data.context) : undefined,
      tenantId: user.tenantId,
    };
    const response = await fetch(`${serviceUrl}/api/analysis/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(safePayload),
    });
    if (!response.ok) return NextResponse.json({ error: 'Analysis failed' }, { status: response.status });
    const downstream = z.record(z.unknown()).safeParse(await response.json());
    if (!downstream.success) return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 502 });
    return NextResponse.json(sanitizeStructuredDataForAI(downstream.data));
  } catch (error) {
    logger.error('AI Analysis error', { error: error instanceof Error ? error.name : 'unknown' });
    return NextResponse.json({ error: 'Failed to connect to AI service' }, { status: 503 });
  }
});
