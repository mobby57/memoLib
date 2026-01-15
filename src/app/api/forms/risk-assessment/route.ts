import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

/**
 * ⚠️ API: Soumission d'évaluation des risques
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      riskCategory,
      riskDescription,
      probability,
      severity,
      mitigationPlan,
      responsiblePerson,
      metadata
    } = data;

    // Calculer le score de risque (matrice probabilité x sévérité)
    const riskScore = calculateRiskScore(probability, severity);
    const priorityLevel = getRiskPriority(riskScore);

    // Créer l'évaluation de risque
    const assessment = await prisma.$executeRaw`
      INSERT INTO RiskAssessment (
        id, category, description, probability, severity,
        riskScore, priorityLevel, mitigationPlan, responsiblePerson,
        status, submitterId, createdAt, updatedAt
      ) VALUES (
        ${generateId()},
        ${riskCategory},
        ${riskDescription},
        ${probability},
        ${severity},
        ${riskScore},
        ${priorityLevel},
        ${mitigationPlan},
        ${responsiblePerson},
        'active',
        ${session.user.email},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `;

    // Si risque critique, créer une alerte immédiate
    if (priorityLevel === 'critical') {
      await createCriticalRiskAlert(assessment, {
        category: riskCategory,
        description: riskDescription,
        riskScore,
      });
    }

    // Générer plan d'action IA
    const aiActionPlan = await generateAIActionPlan({
      category: riskCategory,
      probability,
      severity,
      currentMitigation: mitigationPlan,
    });

    return NextResponse.json({
      success: true,
      assessmentId: assessment,
      riskScore,
      priorityLevel,
      aiActionPlan,
      message: 'Évaluation de risque enregistrée',
    });
  } catch (error) {
    console.error('Erreur évaluation risque:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'évaluation' },
      { status: 500 }
    );
  }
}

function calculateRiskScore(probability: string, severity: string): number {
  const probValues: Record<string, number> = {
    'very-low': 1,
    'low': 2,
    'medium': 3,
    'high': 4,
    'very-high': 5,
  };

  const sevValues: Record<string, number> = {
    'negligible': 1,
    'minor': 2,
    'moderate': 3,
    'major': 4,
    'critical': 5,
  };

  return probValues[probability] * sevValues[severity];
}

function getRiskPriority(score: number): string {
  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

async function createCriticalRiskAlert(assessmentId: any, context: any) {
  // Créer une alerte dans le système
  await prisma.$executeRaw`
    INSERT INTO Alert (
      id, type, severity, title, description, status, createdAt
    ) VALUES (
      ${generateId()},
      'risk-critical',
      'critical',
      ${'Risque critique identifié: ' + context.category},
      ${context.description},
      'active',
      ${new Date().toISOString()}
    )
  `;

  // Notifier les responsables
  console.log('🚨 ALERTE CRITIQUE:', context);
}

async function generateAIActionPlan(data: any): Promise<any> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: `En tant qu'expert en gestion des risques, analyse ce risque et propose un plan d'action détaillé.

Catégorie: ${data.category}
Probabilité: ${data.probability}
Sévérité: ${data.severity}
Mitigation actuelle: ${data.currentMitigation}

Fournis:
1. Actions immédiates (0-7 jours)
2. Actions à moyen terme (1-3 mois)
3. Actions préventives long terme
4. Indicateurs de suivi (KPIs)

Sois concis et actionnable.`,
        stream: false,
      }),
    });

    if (response.ok) {
      const aiData = await response.json();
      return {
        plan: aiData.response,
        confidence: 0.85,
      };
    }
  } catch (error) {
    console.error('Erreur génération plan IA:', error);
  }

  return {
    plan: 'Plan d\'action IA non disponible - suivre le plan de mitigation manuel',
    confidence: 0,
  };
}

function generateId(): string {
  return `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
