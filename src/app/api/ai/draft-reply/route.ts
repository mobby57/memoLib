import { auth } from '@/lib/clerk-auth';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { checkFeatureAccess } from '@/lib/billing/features';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const draftRequestSchema = z.object({
  emailId: z.string().trim().min(1).max(128).optional(),
  subject: z.string().trim().max(500).default(''),
  body: z.string().trim().min(1).max(8_000),
  from: z.string().trim().max(320).default(''),
  dossierId: z.string().trim().min(1).max(128).optional(),
}).strict();
const draftSchema = z.object({
  subject: z.string().trim().min(1).max(600),
  body: z.string().trim().min(1).max(5_000),
  tone: z.enum(['formel', 'empathique', 'urgent']),
  suggestedActions: z.array(z.string().trim().min(1).max(300)).max(5),
}).strict();

export const POST = withAIRateLimit(async (req: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const gate = await checkFeatureAccess(user.tenantId, 'ai_draft_reply');
  if (!gate.allowed) {
    return NextResponse.json({ error: 'FEATURE_GATED', ...gate, upgradeUrl: '/settings/billing?upgrade=true' }, { status: 403 });
  }

  const parsed = draftRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Requête de brouillon invalide' }, { status: 400 });
  const { subject, body, from, dossierId } = parsed.data;

  let context = '';
  if (dossierId) {
    const access = await canAccessDossier({
      userId: user.id, tenantId: user.tenantId, role: user.role, groups: user.groups,
      dossierId, action: 'read',
    });
    if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId: user.tenantId },
      select: { numero: true, typeDossier: true, statut: true, description: true },
    });
    if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
    context = `\nContexte du dossier : ${dossier.numero} — ${dossier.typeDossier} — statut ${dossier.statut}.
Description : ${dossier.description || 'non précisée'}`;
  }

  try {
    const result = await hybridAI.generateWithCostControl(
      `Tu es un assistant de rédaction juridique. Rédige un brouillon de réponse professionnelle.

Email reçu :
De : ${from}
Objet : ${subject}
Corps : ${body}
${context}

Règles :
- N'ajoute aucun fait non fourni et ne formule aucun conseil juridique définitif.
- Accuse réception, indique les prochaines étapes et demande les précisions nécessaires.
- Ne reproduis pas d'identifiants personnels ou coordonnées.
- Maximum 150 mots et signe « Votre conseil ».

Retourne uniquement ce JSON : {"subject":"Re: objet","body":"texte","tone":"formel|empathique|urgent","suggestedActions":["action"]}`,
      user.tenantId
    );
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse IA non structurée');
    const draft = draftSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!draft.success) throw new Error('Réponse IA invalide');
    return NextResponse.json({ ...draft.data, requiresHumanReview: true });
  } catch {
    return NextResponse.json({ ...generateFallback(subject, body), _fallback: true, requiresHumanReview: true });
  }
});

function generateFallback(subject: string, body: string) {
  const isUrgent = /urgent|imm[eé]diat|oqtf/i.test(body);
  return {
    subject: `Re: ${subject || 'votre message'}`,
    body: `Madame, Monsieur,\n\nNous accusons réception de votre ${isUrgent ? 'demande urgente' : 'message'} concernant « ${subject || 'votre dossier'} ».\n\nVotre demande va être examinée. Nous reviendrons vers vous avec les prochaines étapes ou les précisions nécessaires.\n\nBien cordialement,\nVotre conseil`,
    tone: isUrgent ? 'urgent' as const : 'formel' as const,
    suggestedActions: [isUrgent ? 'Vérifier le délai applicable' : 'Examiner la demande'],
  };
}
