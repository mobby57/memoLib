import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ai/second-avis/[dossierId]
 * Joue le rôle du contradicteur : identifie faiblesses, arguments adverses, risques de rejet.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { dossierId } = await params;
  const user = session.user as any;

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: user.tenantId },
    include: {
      client: true,
      checklistItems: true,
      legalDeadlines: { where: { status: 'PENDING' } },
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  // Analyse contradictoire basée sur heuristiques CESEDA
  const weaknesses: any[] = [];
  const missingPieces: string[] = [];
  const adverseArguments: string[] = [];
  const rejectionRisks: any[] = [];
  const reinforcements: string[] = [];

  const type = (dossier.typeDossier || '').toUpperCase();
  const missingItems = dossier.checklistItems.filter(i => i.status === 'missing');
  const requiredMissing = missingItems.filter(i => i.required);

  // Pièces manquantes
  requiredMissing.forEach(item => missingPieces.push(item.label));

  // Faiblesses selon le type de procédure
  if (requiredMissing.length > 0) {
    weaknesses.push({
      point: `${requiredMissing.length} pièce(s) obligatoire(s) manquante(s)`,
      severity: requiredMissing.length >= 3 ? 'critical' : 'high',
      explanation: 'Le tribunal rejette systématiquement les dossiers incomplets. Chaque pièce manquante est un motif de rejet potentiel.',
    });
  }

  if (!dossier.description || dossier.description.length < 50) {
    weaknesses.push({
      point: 'Absence de mémoire ou description insuffisante',
      severity: 'high',
      explanation: 'Un dossier sans argumentation détaillée laisse le juge sur les seuls éléments factuels, souvent insuffisants.',
    });
  }

  // Arguments adverses selon procédure
  if (type.includes('OQTF')) {
    adverseArguments.push('Le préfet invoquera l\'absence de titre de séjour valide');
    adverseArguments.push('Contestation de l\'ancienneté des attaches sur le territoire');
    if (!dossier.description?.includes('8') && !dossier.description?.includes('CEDH')) {
      weaknesses.push({ point: 'Art. 8 CEDH non invoqué explicitement', severity: 'medium', explanation: 'L\'argument vie privée/familiale est souvent déterminant et semble absent du dossier.' });
      reinforcements.push('Invoquer explicitement l\'Art. 8 CEDH avec preuves d\'attaches');
    }
    rejectionRisks.push({ risk: 'Rejet pour défaut d\'intérêt à agir', probability: 'Faible' });
    rejectionRisks.push({ risk: 'Rejet pour irrecevabilité (délai dépassé)', probability: dossier.legalDeadlines.length === 0 ? 'Moyen' : 'Faible' });
  }

  if (type.includes('ASILE')) {
    adverseArguments.push('L\'OFPRA/CNDA questionnera la cohérence du récit');
    adverseArguments.push('Contestation de la crédibilité en l\'absence de preuves matérielles');
    weaknesses.push({ point: 'Risque d\'incohérence dans le récit', severity: 'medium', explanation: 'Les juges CNDA sont formés à détecter les incohérences chronologiques et géographiques.' });
    reinforcements.push('Préparer un récit chronologique précis avec dates et lieux vérifiables');
    reinforcements.push('Fournir des certificats médicaux si violences alléguées');
  }

  if (type.includes('TITRE') || type.includes('SEJOUR')) {
    adverseArguments.push('Le préfet invoquera les conditions de ressources non remplies');
    adverseArguments.push('Contestation de la réalité de l\'insertion professionnelle');
    rejectionRisks.push({ risk: 'Rejet pour menace à l\'ordre public', probability: 'Faible si casier vierge' });
  }

  // Risque générique si peu de pièces
  const totalChecklist = dossier.checklistItems.length;
  const completionRate = totalChecklist > 0 ? (totalChecklist - missingItems.length) / totalChecklist : 0;
  if (completionRate < 0.5) {
    rejectionRisks.push({ risk: 'Rejet pour dossier manifestement incomplet', probability: 'Élevé' });
  }

  // Renforcements génériques
  if (dossier.legalDeadlines.length === 0) {
    reinforcements.push('Identifier et documenter tous les délais applicables');
  }
  reinforcements.push('Ajouter une attestation de domicile récente');
  reinforcements.push('Joindre des attestations de proches (témoignages)');

  // Évaluation globale
  const criticalCount = weaknesses.filter(w => w.severity === 'critical').length;
  const overallAssessment = criticalCount > 0
    ? `⚠️ Dossier fragile — ${criticalCount} point(s) critique(s) identifié(s). Risque de rejet significatif sans renforcement.`
    : weaknesses.length > 2
      ? `Dossier acceptable mais avec ${weaknesses.length} axes d'amélioration. Le renforcement est recommandé avant dépôt.`
      : 'Dossier globalement solide. Points d\'attention mineurs à considérer.';

  return NextResponse.json({
    weaknesses,
    missingPieces,
    adverseArguments,
    rejectionRisks,
    reinforcements,
    overallAssessment,
  });
}
