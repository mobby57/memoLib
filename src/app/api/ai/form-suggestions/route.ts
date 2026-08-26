import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 *  API: Suggestions IA pour formulaires interactifs
 *
 * Analyse le contexte et genere des suggestions intelligentes
 */

const suggestionSchema = z.object({
  formId: z.string().min(1).max(100),
  fieldId: z.string().min(1).max(100),
  context: z.record(z.unknown()).default({}),
});

export const POST = withAIRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }
    if (!session.user.tenantId) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }
    const parsed = suggestionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Requête IA invalide' }, { status: 400 });
    }
    const { formId, fieldId, context } = parsed.data;

    // Analyser le contexte avec le moteur local (Ollama)
    const suggestion = await generateAISuggestion(formId, fieldId, context);

    return NextResponse.json({
      success: true,
      suggestion,
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erreur generation suggestion:', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur generation suggestion' },
      { status: 500 }
    );
  }
});

async function generateAISuggestion(
  formId: string,
  fieldId: string,
  context: Record<string, unknown>
): Promise<string> {
  try {
    // Appeler Ollama local
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: `En tant qu'assistant juridique expert, analyse ce contexte de formulaire et fournis une suggestion professionnelle et concise (maximum 2 phrases).

Formulaire ID: ${formId}
Champ: ${fieldId}
Contexte actuel: ${JSON.stringify(context, null, 2)}

Fournis une suggestion qui:
1. Est pertinente au contexte juridique
2. Anticipe les risques potentiels
3. Propose une meilleure pratique
4. Est actionnable immediatement

Suggestion:`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama API error');
    }

    const data = await response.json();
    return data.response.trim();
  } catch (error) {
    logger.error('Erreur Ollama:', { error });
    // Fallback sur des suggestions predefinies
    return getFallbackSuggestion(formId, fieldId);
  }
}

function getFallbackSuggestion(formId: string, fieldId: string): string {
  const fallbacks: Record<string, string> = {
    priority:
      'Base sur les delais legaux, une priorite HAUTE est recommandee pour les dossiers CESEDA.',
    budget: 'Le budget moyen pour ce type de dossier est de 2500€. Ajuster selon la complexite.',
    deadline: 'Les dossiers CESEDA ont un delai legal de 4 mois. Prevoir une marge de securite.',
    resources: 'Allouer au minimum 2 juristes experimentes pour ce type de dossier.',
  };

  return fallbacks[fieldId] || 'Aucune suggestion disponible pour ce champ.';
}
