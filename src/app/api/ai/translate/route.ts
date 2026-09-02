import { auth } from '@/lib/clerk-auth';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const languageSchema = z.string().trim().min(2).max(60).regex(/^[\p{L}\s-]+$/u);
const translateSchema = z.object({
  text: z.string().trim().min(1).max(8_000),
  sourceLang: languageSchema.optional(),
  targetLang: languageSchema.default('français'),
}).strict();

export const POST = withAIRateLimit(async (req: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const parsed = translateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Requête de traduction invalide' }, { status: 400 });

  const { text, sourceLang = 'détection automatique', targetLang } = parsed.data;
  try {
    const result = await hybridAI.generateWithCostControl(
      `Traduis le texte suivant de ${sourceLang} vers ${targetLang}. Retourne uniquement la traduction, sans commentaire.\n\n${text}`,
      user.tenantId
    );
    return NextResponse.json({
      success: true,
      translation: result.response,
      source: sourceLang,
      target: targetLang,
      requiresHumanReview: true,
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Service de traduction indisponible',
      requiresHumanReview: true,
    }, { status: 503 });
  }
});
