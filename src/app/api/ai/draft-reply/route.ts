import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let requestBody: Record<string, unknown>;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide. JSON attendu.' }, { status: 400 });
  }

  const { emailId, subject, body, from, dossierId } = requestBody as {
    emailId?: string; subject?: string; body?: string; from?: string; dossierId?: string;
  };
  if (!body) return NextResponse.json({ error: 'body requis' }, { status: 400 });

  const user = session.user as any;
  const tenantId = user.tenantId;

  // Récupérer le contexte du dossier si disponible
  let context = '';
  if (dossierId && tenantId) {
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
      include: { client: true },
    });
    if (dossier) {
      context = `\nContexte dossier: ${dossier.numero} — ${dossier.type} — Client: ${(dossier.client as any)?.nom || 'N/A'} — Statut: ${dossier.statut}`;
      if (dossier.description) context += `\nDescription: ${dossier.description}`;
    }
  }

  try {
    const draft = await generateWithAI(subject, body, from, context, user.name || 'Maître');
    return NextResponse.json(draft);
  } catch {
    const draft = generateFallback(subject, body, from, user.name || 'Maître');
    return NextResponse.json({ ...draft, _fallback: true });
  }
}

async function generateWithAI(subject: string, body: string, from: string, context: string, lawyerName: string) {
  const prompt = `Tu es un avocat français. Rédige un brouillon de réponse professionnelle à cet email.

Email reçu:
De: ${from}
Objet: ${subject}
Corps: ${body.slice(0, 1500)}
${context}

Règles:
- Ton professionnel et courtois
- Commence par "Madame/Monsieur" ou le nom si connu
- Accuse réception de la demande
- Indique les prochaines étapes concrètes
- Termine par une formule de politesse
- Signe "${lawyerName}"
- Maximum 150 mots

Retourne UNIQUEMENT un JSON:
{
  "subject": "Re: objet adapté",
  "body": "le texte de la réponse",
  "tone": "formel|empathique|urgent",
  "suggestedActions": ["action1", "action2"]
}`;

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) throw new Error('Ollama unavailable');
  const data = await response.json();
  const jsonMatch = data.response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON');
  return JSON.parse(jsonMatch[0]);
}

function generateFallback(subject: string, body: string, from: string, lawyerName: string) {
  const clientName = from.match(/^([^<@]+)/)?.[1]?.trim() || 'Madame, Monsieur';
  const isUrgent = /urgent|imm[eé]diat|oqtf/i.test(body);

  return {
    subject: `Re: ${subject}`,
    body: `${clientName},

J'accuse bonne réception de votre ${isUrgent ? 'demande urgente' : 'message'} concernant "${subject}".

${isUrgent ? 'Compte tenu de l\'urgence de votre situation, je traite votre dossier en priorité.' : 'Votre demande a bien été enregistrée et sera traitée dans les meilleurs délais.'}

Je reviens vers vous rapidement avec les éléments nécessaires pour la suite de la procédure.

Je reste à votre disposition pour toute question.

Bien cordialement,
${lawyerName}`,
    tone: isUrgent ? 'urgent' : 'formel',
    suggestedActions: [
      'Vérifier les pièces jointes',
      isUrgent ? 'Traiter en priorité' : 'Planifier un rendez-vous',
    ],
  };
}
