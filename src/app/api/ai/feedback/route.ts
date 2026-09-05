import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { sanitizePromptForAI, sanitizeStructuredDataForAI } from '@/lib/ai/prompt-sanitizer';
import { z } from 'zod';

const feedbackSchema = z.object({
  field: z.string().trim().min(1).max(100),
  aiValue: z.string().trim().min(1).max(2_000),
  userValue: z.string().trim().min(1).max(2_000),
  context: z.record(z.unknown()).optional(),
}).strict();

export const POST = withAIRateLimit(async (request: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Retour IA invalide' }, { status: 400 });
  const { field, aiValue, userValue, context } = parsed.data;
  const safeAiValue = sanitizePromptForAI(aiValue).sanitizedText;
  const safeUserValue = sanitizePromptForAI(userValue).sanitizedText;
  const safeContext = context ? sanitizeStructuredDataForAI(context) : undefined;

  await prisma.aIFeedback.create({
    data: { userId: user.id, tenantId: user.tenantId, field, aiValue: safeAiValue, userValue: safeUserValue, context: safeContext },
  });

  // Check if user corrects the same pattern 3+ times → suggest preference
  const count = await prisma.aIFeedback.count({
    where: { userId: user.id, tenantId: user.tenantId, field, aiValue: safeAiValue, userValue: safeUserValue },
  });

  return NextResponse.json({
    saved: true,
    suggestionAvailable: count >= 3,
    occurrences: count,
  });
});

