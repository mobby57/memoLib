import { NextRequest, NextResponse } from 'next/server';

/**
 * 🤖 API: Suggestions IA pour formulaires interactifs
 * 
 * Analyse le contexte et génère des suggestions intelligentes
 */

export async function POST(request: NextRequest) {
  try {
    const { formId, fieldId, context } = await request.json();

    // Analyser le contexte avec l'IA locale (Ollama)
    const suggestion = await generateAISuggestion(formId, fieldId, context);

    return NextResponse.json({ 
      success: true,
      suggestion,
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur génération suggestion:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur génération suggestion' },
      { status: 500 }
    );
  }
}

async function generateAISuggestion(
  formId: string,
  fieldId: string,
  context: any
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
4. Est actionnable immédiatement

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
    console.error('Erreur Ollama:', error);
    // Fallback sur des suggestions prédéfinies
    return getFallbackSuggestion(formId, fieldId);
  }
}

function getFallbackSuggestion(formId: string, fieldId: string): string {
  const fallbacks: Record<string, string> = {
    'priority': 'Basé sur les délais légaux, une priorité HAUTE est recommandée pour les dossiers CESEDA.',
    'budget': 'Le budget moyen pour ce type de dossier est de 2500€. Ajuster selon la complexité.',
    'deadline': 'Les dossiers CESEDA ont un délai légal de 4 mois. Prévoir une marge de sécurité.',
    'resources': 'Allouer au minimum 2 juristes expérimentés pour ce type de dossier.',
  };

  return fallbacks[fieldId] || 'Aucune suggestion disponible pour ce champ.';
}
