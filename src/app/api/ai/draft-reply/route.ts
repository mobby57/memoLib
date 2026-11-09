import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { hybridAI } from '@/lib/ai/hybrid-client';
import { checkFeatureAccess } from '@/lib/billing/features';
import { checkConfidentialMode } from '@/lib/security/confidential-mode';

export async function POST(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const tenantId = user.tenantId;

  // Feature gate : brouillon IA rÃ©servÃ© au plan Cabinet+
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
    return NextResponse.json({ error: 'Corps de requÃªte invalide. JSON attendu.' }, { status: 400 });
  }

  const { emailId, subject, body, from, dossierId } = requestBody as {
    emailId?: string; subject?: string; body?: string; from?: string; dossierId?: string;
  };
  if (!body) return NextResponse.json({ error: 'body requis' }, { status: 400 });

  // RÃ©cupÃ©rer le contexte du dossier si disponible
  let context = '';
  if (dossierId && tenantId) {
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
      include: { client: true },
    });
    if (dossier) {
      context = `\nContexte dossier: ${dossier.numero} â€” ${dossier.type} â€” Client: ${(dossier.client as any)?.nom || 'N/A'} â€” Statut: ${dossier.statut}`;
      if (dossier.description) context += `\nDescription: ${dossier.description}`;
    }
  }

  try {
    // ðŸ”’ Mode confidentiel : si le dossier est confidentiel, forcer local/regex
    if (dossierId) {
      const confidentialCheck = await checkConfidentialMode(dossierId);
      if (confidentialCheck.isConfidential) {
        hybridAI.setPreferredProvider('ollama');
      }
    }
    const draft = await generateWithAI(subject || '', body, from || '', context, user.name || 'MaÃ®tre');
    return NextResponse.json(draft);
  } catch {
    const draft = generateFallback(subject || '', body, from || '', user.name || 'MaÃ®tre');
    return NextResponse.json({ ...draft, _fallback: true });
  }
}

async function generateWithAI(subject: string, body: string, from: string, context: string, lawyerName: string) {
  const prompt = `Tu es un avocat franÃ§ais. RÃ©dige un brouillon de rÃ©ponse professionnelle Ã  cet email.

Email reÃ§u:
De: ${from}
Objet: ${subject}
Corps: ${body.slice(0, 1500)}
${context}

RÃ¨gles:
- Ton professionnel et courtois
- Commence par "Madame/Monsieur" ou le nom si connu
- Accuse rÃ©ception de la demande
- Indique les prochaines Ã©tapes concrÃ¨tes
- Termine par une formule de politesse
- Signe "${lawyerName}"
- Maximum 150 mots

Retourne UNIQUEMENT un JSON:
{
  "subject": "Re: objet adaptÃ©",
  "body": "le texte de la rÃ©ponse",
  "tone": "formel|empathique|urgent",
  "suggestedActions": ["action1", "action2"]
}`;

  const session = await getServerSessionCompat();
  const tenantId = (session?.user as any)?.tenantId || 'demo';

  const aiResult = await hybridAI.generateWithCostControl(prompt, tenantId);
  const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  return JSON.parse(jsonMatch[0]);
}

function generateFallback(subject: string, body: string, from: string, lawyerName: string) {
  const clientName = from.match(/^([^<@]+)/)?.[1]?.trim() || 'Madame, Monsieur';
  const isUrgent = /urgent|imm[eÃ©]diat|oqtf/i.test(body);

  return {
    subject: `Re: ${subject}`,
    body: `${clientName},

J'accuse bonne rÃ©ception de votre ${isUrgent ? 'demande urgente' : 'message'} concernant "${subject}".

${isUrgent ? 'Compte tenu de l\'urgence de votre situation, je traite votre dossier en prioritÃ©.' : 'Votre demande a bien Ã©tÃ© enregistrÃ©e et sera traitÃ©e dans les meilleurs dÃ©lais.'}

Je reviens vers vous rapidement avec les Ã©lÃ©ments nÃ©cessaires pour la suite de la procÃ©dure.

Je reste Ã  votre disposition pour toute question.

Bien cordialement,
${lawyerName}`,
    tone: isUrgent ? 'urgent' : 'formel',
    suggestedActions: [
      'VÃ©rifier les piÃ¨ces jointes',
      isUrgent ? 'Traiter en prioritÃ©' : 'Planifier un rendez-vous',
    ],
  };
}

