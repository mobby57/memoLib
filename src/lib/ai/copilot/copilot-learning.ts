/**
 * Copilote CESEDA — Co-adaptation (apprentissage des corrections)
 *
 * Quand l'avocat corrige une analyse du Copilote, le système
 * enregistre le feedback et ajuste les futures analyses.
 *
 * Principes (règle co-adaptation MemoLib) :
 * - Le système OBSERVE les corrections
 * - Il PROPOSE des ajustements (jamais impose)
 * - L'utilisateur peut ACCEPTER, MODIFIER ou REFUSER
 * - Toute adaptation est EXPLICABLE et RÉVERSIBLE
 */

export interface CopilotFeedback {
  dossierId: string;
  userId: string;
  tenantId: string;
  field: string; // 'riskLevel', 'strength_added', 'weakness_removed', 'action_dismissed'
  copilotValue: string;
  userValue: string;
  context: { typeDossier: string; situation?: string[] };
  timestamp: Date;
}

export interface LearningRule {
  tenantId: string;
  condition: { typeDossier?: string; field: string; pattern?: string };
  adjustment: { override?: string; boost?: number; suppress?: boolean };
  confidence: number;
  occurrences: number;
  lastSeen: Date;
}

/**
 * Enregistre un feedback utilisateur sur une analyse Copilote
 */
export async function recordFeedback(feedback: CopilotFeedback): Promise<void> {
  const { prisma } = await import('@/lib/prisma');

  await prisma.aIFeedback.create({
    data: {
      userId: feedback.userId,
      tenantId: feedback.tenantId,
      field: feedback.field,
      aiValue: feedback.copilotValue,
      userValue: feedback.userValue,
      context: JSON.stringify(feedback.context),
      createdAt: new Date(),
    },
  });
}

/**
 * Analyse les feedbacks pour proposer des règles d'ajustement
 */
export async function computeLearningRules(tenantId: string): Promise<LearningRule[]> {
  const { prisma } = await import('@/lib/prisma');

  const feedbacks = await prisma.aIFeedback.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // Grouper par (field + typeDossier)
  const groups: Record<string, { copilotValues: string[]; userValues: string[]; count: number; lastSeen: Date }> = {};

  for (const fb of feedbacks) {
    const ctx = JSON.parse(fb.context || '{}');
    const key = `${fb.field}|${ctx.typeDossier || 'ALL'}`;
    if (!groups[key]) groups[key] = { copilotValues: [], userValues: [], count: 0, lastSeen: fb.createdAt };
    groups[key].copilotValues.push(fb.aiValue);
    groups[key].userValues.push(fb.userValue);
    groups[key].count++;
    if (fb.createdAt > groups[key].lastSeen) groups[key].lastSeen = fb.createdAt;
  }

  // Générer des règles si pattern détecté (3+ corrections identiques)
  const rules: LearningRule[] = [];

  for (const [key, group] of Object.entries(groups)) {
    if (group.count < 3) continue;

    const [field, typeDossier] = key.split('|');

    // Trouver la valeur utilisateur la plus fréquente
    const valueCounts: Record<string, number> = {};
    for (const v of group.userValues) {
      valueCounts[v] = (valueCounts[v] || 0) + 1;
    }
    const topValue = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0];

    if (topValue && topValue[1] >= 3) {
      rules.push({
        tenantId,
        condition: { typeDossier: typeDossier === 'ALL' ? undefined : typeDossier, field },
        adjustment: { override: topValue[0] },
        confidence: topValue[1] / group.count,
        occurrences: group.count,
        lastSeen: group.lastSeen,
      });
    }
  }

  return rules;
}

/**
 * Applique les règles d'apprentissage à une analyse
 */
export function applyLearningRules(analysis: Record<string, any>, rules: LearningRule[], typeDossier: string): Record<string, any> {
  const adjusted = { ...analysis };

  for (const rule of rules) {
    if (rule.confidence < 0.6) continue; // seuil minimum
    if (rule.condition.typeDossier && rule.condition.typeDossier !== typeDossier) continue;

    if (rule.adjustment.override && rule.condition.field in adjusted) {
      adjusted[`_suggestion_${rule.condition.field}`] = {
        suggestedValue: rule.adjustment.override,
        reason: `Basé sur ${rule.occurrences} corrections précédentes (confiance ${Math.round(rule.confidence * 100)}%)`,
        autoApplied: false,
      };
    }
  }

  return adjusted;
}
