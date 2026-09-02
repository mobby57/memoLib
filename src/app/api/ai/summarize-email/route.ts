import { auth } from '@/lib/clerk-auth';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { checkFeatureAccess } from '@/lib/billing/features';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const emailSummaryRequestSchema = z.object({
  emailId: z.string().trim().min(1).max(128).optional(),
  subject: z.string().trim().max(500).default(''),
  body: z.string().trim().min(1).max(8_000),
  from: z.string().trim().max(320).default(''),
}).strict();
const emailSummarySchema = z.object({
  objet: z.string().trim().min(1).max(300),
  urgence: z.enum(['basse', 'moyenne', 'haute', 'critique']),
  actionRequise: z.string().trim().min(1).max(500),
  deadlineDetectee: z.string().trim().max(100).nullable(),
  typeDossier: z.enum(['TITRE_SEJOUR', 'NATURALISATION', 'OQTF', 'ASILE', 'REGROUPEMENT_FAMILIAL', 'CONTENTIEUX', 'GENERAL']),
  resumeCourt: z.string().trim().min(1).max(1_000),
}).strict();

export const POST = withAIRateLimit(async (req: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const gate = await checkFeatureAccess(user.tenantId, 'ai_email_summary');
  if (!gate.allowed) {
    return NextResponse.json({ error: 'FEATURE_GATED', ...gate, upgradeUrl: '/settings/billing?upgrade=true' }, { status: 403 });
  }

  const parsed = emailSummaryRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Requête de résumé invalide' }, { status: 400 });
  const { subject, body, from } = parsed.data;

  try {
    const result = await hybridAI.generateWithCostControl(
      `Tu es un assistant juridique. Analyse cet email. Ne retourne aucun nom, email, adresse ou autre identifiant personnel.

Objet : ${subject}
Corps : ${body}
Expéditeur : ${from}

Retourne uniquement ce JSON :
{"objet":"résumé en 10 mots maximum","urgence":"basse|moyenne|haute|critique","actionRequise":"action concrète","deadlineDetectee":"date ou null","typeDossier":"TITRE_SEJOUR|NATURALISATION|OQTF|ASILE|REGROUPEMENT_FAMILIAL|CONTENTIEUX|GENERAL","resumeCourt":"résumé en deux phrases maximum"}`,
      user.tenantId
    );
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse IA non structurée');
    const summary = emailSummarySchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!summary.success) throw new Error('Réponse IA invalide');
    return NextResponse.json({
      ...summary.data,
      confidence: { urgence: 0.8, typeDossier: 0.8, deadline: 0.7 },
      requiresHumanReview: true,
    });
  } catch {
    return NextResponse.json({
      ...summarizeWithRules(subject, body),
      _fallback: true,
      confidence: { urgence: 0.6, typeDossier: 0.6, deadline: 0.4 },
      requiresHumanReview: true,
    });
  }
});

function summarizeWithRules(subject: string, body: string) {
  const text = `${subject} ${body}`.toLowerCase();
  const urgence = /urgent|imm[eé]diat|48h|24h|oqtf sans d[eé]lai/.test(text) ? 'critique'
    : /d[eé]lai|[eé]ch[eé]ance|rapidement|au plus vite/.test(text) ? 'haute'
    : /merci de|pourriez-vous|demande/.test(text) ? 'moyenne' : 'basse';
  const typeDossier = /oqtf|obligation de quitter/.test(text) ? 'OQTF'
    : /asile|r[eé]fugi[eé]|ofpra|cnda/.test(text) ? 'ASILE'
    : /regroupement familial/.test(text) ? 'REGROUPEMENT_FAMILIAL'
    : /naturalisation|nationalit[eé]/.test(text) ? 'NATURALISATION'
    : /titre de s[eé]jour|carte de s[eé]jour|r[eé]c[eé]piss[eé]/.test(text) ? 'TITRE_SEJOUR' : 'GENERAL';
  const deadline = text.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{1,2}\s+(?:janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\s+\d{4})/)?.[0] || null;
  return {
    objet: subject || 'Sans objet', urgence, actionRequise: urgence === 'critique' ? 'Vérifier et traiter immédiatement' : 'Examiner et répondre',
    deadlineDetectee: deadline, typeDossier, resumeCourt: `Message relatif à un dossier ${typeDossier.toLowerCase().replace('_', ' ')}. Vérification humaine requise.`,
  };
}
