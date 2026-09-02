import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { z } from 'zod';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';

const paramsSchema = z.object({ dossierId: z.string().trim().min(1).max(128) }).strict();
type Risk = {
  level: 'low' | 'medium' | 'high' | 'critical';
  category: 'pieces' | 'deadline' | 'procedure' | 'incomplete';
  message: string;
  items?: string[];
};

/**
 * GET /api/ai/risk-analysis/[dossierId]
 * Analyse les risques d'un dossier et identifie les points faibles.
 */
export const GET = withAIRateLimit(async (
  req: NextRequest,
  context?: { params: Promise<{ dossierId: string }> }
) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const parsedParams = paramsSchema.safeParse(await context?.params);
  if (!parsedParams.success) return NextResponse.json({ error: 'Dossier invalide' }, { status: 400 });
  const { dossierId } = parsedParams.data;
  if (!user.tenantId) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });

  const access = await canAccessDossier({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    groups: user.groups,
    dossierId,
    action: 'read',
  });
  if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: user.tenantId },
    select: {
      checklistItems: true,
      legalDeadlines: true,
      typeDossier: true,
      juridiction: true,
      description: true,
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  const risks: Risk[] = [];
  let score = 100;

  // Pieces manquantes
  const missing = dossier.checklistItems.filter(i => i.status === 'missing' && i.required);
  if (missing.length > 0) {
    score -= missing.length * 10;
    risks.push({ level: 'high', category: 'pieces', message: `${missing.length} piece(s) obligatoire(s) manquante(s)`, items: missing.map(m => m.label) });
  }

  // Deadlines proches
  const now = new Date();
  const urgentDeadlines = dossier.legalDeadlines.filter(d => d.status === 'PENDING' && new Date(d.dueDate).getTime() - now.getTime() < 7 * 86400000);
  if (urgentDeadlines.length > 0) {
    score -= 20;
    risks.push({ level: 'critical', category: 'deadline', message: `${urgentDeadlines.length} echeance(s) dans moins de 7 jours`, items: urgentDeadlines.map(d => `${d.label} (${new Date(d.dueDate).toLocaleDateString('fr-FR')})`) });
  }

  // Type de procedure a risque
  if (dossier.typeDossier === 'OQTF_SANS_DELAI') {
    score -= 15;
    risks.push({ level: 'critical', category: 'procedure', message: 'OQTF sans delai — risque d\'execution immediate' });
  }

  // Pas de juridiction definie
  if (!dossier.juridiction) {
    score -= 5;
    risks.push({ level: 'medium', category: 'incomplete', message: 'Juridiction non definie' });
  }

  // Pas de description
  if (!dossier.description) {
    score -= 5;
    risks.push({ level: 'low', category: 'incomplete', message: 'Description du dossier vide' });
  }

  return NextResponse.json({
    dossierId,
    score: Math.max(0, score),
    level: score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high',
    risks,
    recommendation: score < 50 ? 'ACTION URGENTE REQUISE' : score < 80 ? 'Points a ameliorer' : 'Dossier en bonne voie',
  });
});
