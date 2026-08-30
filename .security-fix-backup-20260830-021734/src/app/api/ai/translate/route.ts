import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/ai/translate
 * Traduit un texte ou document vers le francais.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { text, sourceLang, targetLang } = await req.json();

  if (!text) return NextResponse.json({ error: 'text requis' }, { status: 400 });

  const ollamaUrl = process.env.OLLAMA_URL;
  const target = targetLang || 'francais';
  const source = sourceLang || 'auto-detect';

  if (ollamaUrl) {
    try {
      const prompt = `Traduis ce texte en ${target}. Retourne uniquement la traduction, sans commentaire.\n\nTexte: "${text}"`;
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: process.env.OLLAMA_MODEL || 'llama3.2:latest', prompt, stream: false }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ success: true, translation: data.response, source, target, provider: 'ollama' });
      }
    } catch { /* fallback */ }
  }

  return NextResponse.json({
    success: true,
    translation: `[TRADUCTION ${target.toUpperCase()}] ${text.substring(0, 200)}...`,
    source,
    target,
    provider: 'fallback',
    note: 'Configurez OLLAMA_URL pour la traduction reelle',
  });
}
