import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeDossier, type DossierInput } from '@/lib/ai/copilot/copilot-ceseda';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { sanitizePromptForAI } from '@/lib/ai/prompt-sanitizer';
import { z } from 'zod';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';

const paramsSchema = z.object({ dossierId: z.string().trim().min(1).max(128) }).strict();

/**
 * GET /api/ai/copilot/[dossierId]
 * Copilote CESEDA — Analyse complète d'un dossier
 */
export const GET = withAIRateLimit(async (
  req: NextRequest,
  context?: { params: Promise<{ dossierId: string }> }
) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const parsedParams = paramsSchema.safeParse(await context?.params);
  if (!parsedParams.success) return NextResponse.json({ error: 'Dossier invalide' }, { status: 400 });
  const { dossierId } = parsedParams.data;
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const access = await canAccessDossier({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    groups: user.groups,
    dossierId,
    action: 'read',
  });
  if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: user.tenantId },
    include: {
      checklistItems: { select: { label: true, status: true, required: true } },
      legalDeadlines: { select: { label: true, dueDate: true, status: true } },
      emails: { select: { subject: true, bodyText: true, receivedDate: true }, orderBy: { receivedDate: 'desc' }, take: 10 },
      documents: { select: { name: true, type: true } },
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  const input: DossierInput = {
    id: dossier.id,
    typeDossier: dossier.typeDossier,
    description: dossier.description ? sanitizePromptForAI(dossier.description).sanitizedText : undefined,
    notes: dossier.notes ? sanitizePromptForAI(dossier.notes).sanitizedText : undefined,
    statut: dossier.statut,
    dateCreation: dossier.dateCreation.toISOString(),
    dateEcheance: dossier.dateEcheance?.toISOString(),
    client: {},
    checklistItems: dossier.checklistItems,
    legalDeadlines: dossier.legalDeadlines.map(d => ({ ...d, dueDate: d.dueDate.toISOString() })),
    emails: dossier.emails.map(e => ({
      subject: sanitizePromptForAI(e.subject || '').sanitizedText,
      body: sanitizePromptForAI(e.bodyText || '').sanitizedText,
      from: '',
      receivedDate: e.receivedDate.toISOString(),
    })),
    documents: dossier.documents.map(d => ({ name: d.name || '', type: d.type || '' })),
  };

  const analysis = analyzeDossier(input);

  return NextResponse.json(analysis);
});
