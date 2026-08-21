import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { checkFeatureAccess } from '@/lib/billing/features';
import { checkConfidentialMode } from '@/lib/security/confidential-mode';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;

  // Feature gate : brouillon IA réservé au plan Cabinet+
  if (tenantId) {
    const gate = await checkFeatureAccess(tenantId, 'ai_draft_reply');
    if (!gate.allowed) {
      return NextResponse.json({
        error: 'FEATURE_GATED',
        ...gate,
        upgradeUrl: '/settings/billing?upgrade=true',
      }, { status: 403 });
    }
  }

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
    // 🔒 Mode confidentiel : si le dossier est confidentiel, forcer local/regex
    if (dossierId) {
      const confidentialCheck = await checkConfidentialMode(dossierId);
      if (confidentialCheck.isConfidential) {
        hybridAI.setPreferredProvider('ollama');
      }
    }
    const draft = await generateWithAI(subject || '', body, from || '', context, user.name || 'Maître');
    return NextResponse.json(draft);
  } catch {
    const draft = generateFallback(subject || '', body, from || '', user.name || 'Maître');
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

  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId || 'demo';

  const aiResult = await hybridAI.generateWithCostControl(prompt, tenantId);
  const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
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
