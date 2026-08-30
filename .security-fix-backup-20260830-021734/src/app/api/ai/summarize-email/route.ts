import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { checkFeatureAccess } from '@/lib/billing/features';
import { checkEmailConfidential } from '@/lib/security/confidential-mode';

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
  const isDemoRequest = !session && req.headers.get('referer')?.includes('/demo');
  if (!session?.user && !isDemoRequest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Feature gate : résumé IA réservé au plan Solo+
  const tenantId = (session?.user as any)?.tenantId;
  if (tenantId && !isDemoRequest) {
    const gate = await checkFeatureAccess(tenantId, 'ai_email_summary');
    if (!gate.allowed) {
      return NextResponse.json({
        error: 'FEATURE_GATED',
        ...gate,
        upgradeUrl: '/settings/billing?upgrade=true',
      }, { status: 403 });
    }
  }
  let body_data: Record<string, unknown>;
  try {
    body_data = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide. JSON attendu.' }, { status: 400 });
  }

  const { subject, body, from } = body_data as { subject?: string; body?: string; from?: string };
  if (!body) return NextResponse.json({ error: 'body requis' }, { status: 400 });

  // 🔒 Mode confidentiel : si l'email est lié à un dossier confidentiel, forcer local/regex
  const emailId = body_data.emailId as string | undefined;
  const confidentialCheck = await checkEmailConfidential(emailId || '');

  try {
    if (confidentialCheck.isConfidential) {
      // Mode confidentiel : essayer Ollama uniquement, sinon regex
      hybridAI.setPreferredProvider('ollama');
    }
    const summary = await summarizeWithAI(subject || '', body, from || '');
    return NextResponse.json({ 
      ...summary, 
      confidence: { client: 0.85, urgence: 0.8, typeDossier: 0.8, deadline: 0.7 },
      _confidentialMode: confidentialCheck.isConfidential || undefined,
      _disclaimer: "⚠️ Les délais détectés sont indicatifs. Vérifiez TOUJOURS la date de notification sur l'acte original. MemoLib assiste mais ne remplace pas la vérification humaine.",
    });
  } catch {
    // Fallback regex si Ollama indisponible
    const summary = summarizeWithRegex(subject || '', body, from || '');
    return NextResponse.json({ 
      ...summary, 
      _fallback: true, 
      _confidentialMode: confidentialCheck.isConfidential || undefined,
      confidence: { client: 0.5, urgence: 0.6, typeDossier: 0.6, deadline: 0.4 },
      _disclaimer: "⚠️ Analyse par mots-clés (IA indisponible). Les délais détectés sont indicatifs. Vérifiez TOUJOURS la date de notification sur l'acte original.",
    });
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

  const user = await getServerSession(authOptions);
  const tenantId = (user?.user as any)?.tenantId || 'demo';

  const aiResult = await hybridAI.generateWithCostControl(prompt, tenantId);
  const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  return JSON.parse(jsonMatch[0]);
}

function summarizeWithRegex(subject: string, body: string, from: string): EmailSummary {
  const text = `${subject} ${body}`.toLowerCase();

  // Détection urgence
  let urgence: EmailSummary['urgence'] = 'basse';
  if (text.match(/urgent|imm[eé]diat|48h|24h|oqtf sans d[eé]lai/)) urgence = 'critique';
  else if (text.match(/d[eé]lai|[eé]ch[eé]ance|rapidement|au plus vite/)) urgence = 'haute';
  else if (text.match(/merci de|pourriez-vous|demande/)) urgence = 'moyenne';

  // Détection type dossier (ordre = priorité, OQTF d'abord car plus urgent)
  let typeDossier = 'GENERAL';
  if (text.match(/oqtf|obligation de quitter/)) typeDossier = 'OQTF';
  else if (text.match(/asile|r[eé]fugi[eé]|ofpra|cnda/)) typeDossier = 'ASILE';
  else if (text.match(/regroupement familial/)) typeDossier = 'REGROUPEMENT_FAMILIAL';
  else if (text.match(/naturalisation|nationalit[eé]/)) typeDossier = 'NATURALISATION';
  else if (text.match(/titre de s[eé]jour|carte de s[eé]jour|r[eé]c[eé]piss[eé]/)) typeDossier = 'TITRE_SEJOUR';

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
