import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { analyzeDossier, type DossierInput } from '@/lib/ai/copilot/copilot-ceseda';
import { enrichWithAI } from '@/lib/ai/copilot/copilot-ai-enrichment';
import { findSimilarCases } from '@/lib/ai/copilot/copilot-rag';
import { computeLearningRules, applyLearningRules } from '@/lib/ai/copilot/copilot-learning';

/**
 * GET /api/ai/copilot/[dossierId]
 * Copilote CESEDA — Analyse complète d'un dossier
 * 
 * Params optionnels :
 * - ?enrich=true → ajoute l'enrichissement IA (Ollama)
 * - ?rag=true → recherche documents similaires
 * - ?learn=true → applique les règles d'apprentissage
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { dossierId } = await params;
  const user = session.user as any;
  const url = new URL(req.url);
  const wantEnrich = url.searchParams.get('enrich') === 'true';
  const wantRAG = url.searchParams.get('rag') === 'true';
  const wantLearn = url.searchParams.get('learn') === 'true';

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: user.tenantId },
    include: {
      client: { select: { firstName: true, lastName: true, email: true } },
      checklistItems: { select: { label: true, status: true, required: true } },
      legalDeadlines: { select: { label: true, dueDate: true, status: true } },
      emails: { select: { subject: true, bodyText: true, from: true, receivedDate: true }, orderBy: { receivedDate: 'desc' }, take: 10 },
      documents: { select: { name: true, type: true } },
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  const input: DossierInput = {
    id: dossier.id,
    typeDossier: dossier.typeDossier,
    description: dossier.description || undefined,
    notes: dossier.notes || undefined,
    statut: dossier.statut,
    dateCreation: dossier.dateCreation.toISOString(),
    dateEcheance: dossier.dateEcheance?.toISOString(),
    client: dossier.client || { firstName: undefined, lastName: undefined, email: undefined },
    checklistItems: dossier.checklistItems,
    legalDeadlines: dossier.legalDeadlines.map(d => ({ ...d, dueDate: d.dueDate.toISOString() })),
    emails: dossier.emails.map(e => ({ subject: e.subject || '', body: e.bodyText || '', from: e.from || '', receivedDate: e.receivedDate.toISOString() })),
    documents: dossier.documents.map(d => ({ name: d.name || '', type: d.type || '' })),
  };

  const analysis = analyzeDossier(input);

  // Enrichissement IA (optionnel)
  let aiEnrichment = null;
  if (wantEnrich) {
    aiEnrichment = await enrichWithAI({
      typeDossier: dossier.typeDossier,
      situation: analysis.summary.situation,
      strengths: analysis.strengths.map(s => s.label),
      weaknesses: analysis.weaknesses.map(w => w.label),
      missingDocs: analysis.completeness.missing,
      deadlineDays: analysis.deadlines[0]?.daysRemaining,
    });
  }

  // RAG — documents similaires (optionnel)
  let similarDocuments = null;
  if (wantRAG) {
    similarDocuments = await findSimilarCases(dossier.typeDossier, analysis.summary.situation, user.tenantId);
  }

  // Co-adaptation — règles apprises (optionnel)
  let learningAdjustments = null;
  if (wantLearn) {
    const rules = await computeLearningRules(user.tenantId);
    if (rules.length > 0) {
      learningAdjustments = applyLearningRules(analysis.summary, rules, dossier.typeDossier);
    }
  }

  return NextResponse.json({ ...analysis, aiEnrichment, similarDocuments, learningAdjustments });
}
