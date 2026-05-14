import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

interface EmailSummary {
  client: string | null;
  objet: string;
  urgence: 'basse' | 'moyenne' | 'haute' | 'critique';
  actionRequise: string;
  deadlineDetectee: string | null;
  typeDossier: string;
  resumeCourt: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, body, from } = await req.json();
  if (!body) return NextResponse.json({ error: 'body requis' }, { status: 400 });

  try {
    const summary = await summarizeWithAI(subject || '', body, from || '');
    return NextResponse.json(summary);
  } catch {
    // Fallback regex si Ollama indisponible
    const summary = summarizeWithRegex(subject || '', body, from || '');
    return NextResponse.json({ ...summary, _fallback: true });
  }
}

async function summarizeWithAI(subject: string, body: string, from: string): Promise<EmailSummary> {
  const prompt = `Tu es un assistant juridique. Analyse cet email et retourne UNIQUEMENT un JSON valide (pas de texte avant/après).

De: ${from}
Objet: ${subject}
Corps: ${body.slice(0, 2000)}

Retourne ce JSON:
{
  "client": "nom du client ou null",
  "objet": "résumé de la demande en 10 mots max",
  "urgence": "basse|moyenne|haute|critique",
  "actionRequise": "action concrète à faire en 1 phrase",
  "deadlineDetectee": "date si mentionnée ou null",
  "typeDossier": "TITRE_SEJOUR|NATURALISATION|OQTF|ASILE|REGROUPEMENT_FAMILIAL|CONTENTIEUX|GENERAL",
  "resumeCourt": "résumé complet en 2 phrases max"
}`;

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

  const data = await response.json();
  const jsonMatch = data.response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  return JSON.parse(jsonMatch[0]);
}

function summarizeWithRegex(subject: string, body: string, from: string): EmailSummary {
  const text = `${subject} ${body}`.toLowerCase();

  // Détection urgence
  let urgence: EmailSummary['urgence'] = 'basse';
  if (text.match(/urgent|imm[eé]diat|48h|24h|oqtf sans d[eé]lai/)) urgence = 'critique';
  else if (text.match(/d[eé]lai|[eé]ch[eé]ance|rapidement|au plus vite/)) urgence = 'haute';
  else if (text.match(/merci de|pourriez-vous|demande/)) urgence = 'moyenne';

  // Détection type dossier
  let typeDossier = 'GENERAL';
  if (text.match(/titre de s[eé]jour|carte de s[eé]jour|r[eé]c[eé]piss[eé]/)) typeDossier = 'TITRE_SEJOUR';
  else if (text.match(/naturalisation|nationalit[eé]/)) typeDossier = 'NATURALISATION';
  else if (text.match(/oqtf|obligation de quitter/)) typeDossier = 'OQTF';
  else if (text.match(/asile|r[eé]fugi[eé]|ofpra|cnda/)) typeDossier = 'ASILE';
  else if (text.match(/regroupement familial/)) typeDossier = 'REGROUPEMENT_FAMILIAL';

  // Extraction client depuis "from"
  const client = from.match(/^([^<@]+)/)?.[1]?.trim() || null;

  // Détection deadline
  const deadlineMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{1,2}\s+(?:janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s+\d{4})/);
  const deadlineDetectee = deadlineMatch?.[0] || null;

  return {
    client,
    objet: subject || 'Sans objet',
    urgence,
    actionRequise: urgence === 'critique' ? 'Traiter immédiatement' : 'À analyser et répondre',
    deadlineDetectee,
    typeDossier,
    resumeCourt: `Email de ${client || 'expéditeur inconnu'} concernant ${typeDossier.toLowerCase().replace('_', ' ')}. ${urgence === 'critique' ? 'Action urgente requise.' : 'À traiter.'}`,
  };
}
