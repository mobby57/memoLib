import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
/**
 * POST /api/voice/transcribe
 * Recoit un fichier audio (dictee vocale) et retourne des notes structurees.
 * Utilise Ollama Whisper ou fallback Web Speech API cote client.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const body = await req.json();
  const { transcript, dossierId, context } = body;

  if (!transcript) {
    return NextResponse.json({ error: 'transcript requis (texte de la dictee)' }, { status: 400 });
  }

  // Structurer la dictee avec l'IA
  const structured = await structureTranscript(transcript, context);

  return NextResponse.json({
    success: true,
    original: transcript,
    structured,
  });
}

async function structureTranscript(transcript: string, context?: string): Promise<any> {
  const ollamaUrl = process.env.OLLAMA_URL;

  if (ollamaUrl) {
    try {
      const prompt = `Tu es un assistant juridique. Structure cette dictee vocale d'un avocat en notes organisees.
${context ? `Contexte du dossier: ${context}` : ''}

Dictee: "${transcript}"

Retourne un JSON avec: { "resume": "...", "pointsCles": ["..."], "actions": ["..."], "datesMentionnees": ["..."], "personnesMentionnees": ["..."] }`;

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'llama3.2:latest',
          prompt,
          stream: false,
          format: 'json',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        try { return JSON.parse(data.response); } catch { /* fallback */ }
      }
    } catch (e) { /* fallback */ }
  }

  // Fallback: structuration basique par regex
  return fallbackStructure(transcript);
}

function fallbackStructure(transcript: string): any {
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 5);

  const actions = sentences.filter(s =>
    /faire|envoyer|appeler|deposer|preparer|verifier|contacter|relancer/i.test(s)
  ).map(s => s.trim());

  const dates = transcript.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|lundi|mardi|mercredi|jeudi|vendredi|demain|la semaine prochaine/gi) || [];

  const personnes = transcript.match(/(?:monsieur|madame|maitre|m\.|mme)\s+[A-Z][a-z]+/gi) || [];

  return {
    resume: sentences.slice(0, 2).join('. ').trim() + '.',
    pointsCles: sentences.slice(0, 5).map(s => s.trim()),
    actions: actions.length > 0 ? actions : ['Aucune action detectee'],
    datesMentionnees: [...new Set(dates)],
    personnesMentionnees: [...new Set(personnes)],
  };
}


