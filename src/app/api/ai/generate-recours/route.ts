import { auth } from '@/lib/clerk-auth';
import { hybridAI } from '@/lib/ai/hybrid-client';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const recoursSchema = z.object({
  dossierId: z.string().trim().min(1).max(128),
  typeRecours: z.string().trim().min(2).max(100),
  arguments: z.string().trim().max(6_000).optional(),
}).strict();

export const POST = withAIRateLimit(async (req: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const parsed = recoursSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Requête de recours invalide' }, { status: 400 });
  const { dossierId, typeRecours, arguments: additionalArguments } = parsed.data;

  const access = await canAccessDossier({
    userId: user.id, tenantId: user.tenantId, role: user.role, groups: user.groups,
    dossierId, action: 'read',
  });
  if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: user.tenantId },
    select: { typeDossier: true, juridiction: true, objet: true, description: true },
  });
  if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  try {
    const result = await hybridAI.generateWithCostControl(
      `Tu es un avocat expert en droit des étrangers. Rédige un brouillon de ${typeRecours}.

Type de dossier: ${dossier.typeDossier}
Juridiction: ${dossier.juridiction || 'Tribunal administratif'}
Objet: ${dossier.objet || 'Non précisé'}
Description: ${dossier.description || 'Non précisée'}
${additionalArguments ? `Arguments supplémentaires: ${additionalArguments}` : ''}

Structure le recours avec : En-tête, Faits, Discussion (moyens de droit), Demandes.
N'affirme aucun fait, délai ou article non présent dans les éléments. Signale les informations à compléter.`,
      user.tenantId
    );
    return NextResponse.json({
      success: true,
      typeRecours,
      dossierId,
      content: result.response,
      wordCount: result.response.trim().split(/\s+/).filter(Boolean).length,
      requiresHumanReview: true,
    });
  } catch {
    const content = generateFallbackRecours(dossier, typeRecours);
    return NextResponse.json({
      success: true, typeRecours, dossierId, content,
      wordCount: content.split(/\s+/).length, _fallback: true, requiresHumanReview: true,
    });
  }
});

function generateFallbackRecours(
  dossier: { typeDossier: string; juridiction: string | null; objet: string | null },
  typeRecours: string
): string {
  return `TRIBUNAL ADMINISTRATIF DE [VILLE]

RECOURS ${typeRecours.toUpperCase()}

OBJET : ${dossier.objet || `Recours relatif à ${dossier.typeDossier}`}
JURIDICTION : ${dossier.juridiction || '[À compléter]'}

FAITS

[Décrire les faits vérifiés et les pièces qui les étayent.]

DISCUSSION

[Développer les moyens de droit après vérification des textes applicables.]

PAR CES MOTIFS

[Préciser les demandes après validation par l’avocat.]`;
}
