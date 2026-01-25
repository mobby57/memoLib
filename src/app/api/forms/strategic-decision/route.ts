import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

/**
 * 🎯 API: Soumission de decision strategique
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      decisionTitle, 
      context, 
      proposedSolution, 
      expectedImpact, 
      risks, 
      timeline, 
      kpis,
      metadata 
    } = data;

    // Calculer le score de risque
    const riskScore = await analyzeDecisionRisks({
      proposedSolution,
      risks,
      expectedImpact,
    });

    // Creer la soumission
    const submission = await prisma.$executeRaw`
      INSERT INTO StrategicDecision (
        id, title, context, proposedSolution, expectedImpact,
        risks, timeline, kpis, riskScore, status, submitterId,
        createdAt, updatedAt
      ) VALUES (
        ${generateId()},
        ${decisionTitle},
        ${context},
        ${proposedSolution},
        ${JSON.stringify(expectedImpact)},
        ${risks},
        ${timeline},
        ${kpis},
        ${riskScore},
        'pending-approval',
        ${session.user.email},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `;

    // Creer workflow d'approbation multi-niveaux
    if (metadata.requiresApproval) {
      await createApprovalWorkflow(submission, metadata.approvers, {
        title: decisionTitle,
        riskScore,
        impactScore: metadata.impactScore,
      });
    }

    // Analyser avec l'IA et generer recommandations
    const aiAnalysis = await getAIDecisionAnalysis(data);

    return NextResponse.json({
      success: true,
      submissionId: submission,
      riskScore,
      aiAnalysis,
      message: 'Decision soumise pour approbation',
    });
  } catch (error) {
    console.error('Erreur soumission decision:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la soumission' },
      { status: 500 }
    );
  }
}

async function analyzeDecisionRisks(data: any): Promise<number> {
  // Analyse basique des risques
  // Dans une version avancee, utiliser l'IA pour l'analyse
  const riskFactors = {
    hasRiskMitigation: data.risks && data.risks.length > 100 ? 1 : 0,
    impactBreadth: data.expectedImpact.length || 0,
    solutionClarity: data.proposedSolution.length > 200 ? 1 : 0,
  };

  const score = Object.values(riskFactors).reduce((a, b) => a + b, 0);
  return Math.min(10, score * 2);
}

async function createApprovalWorkflow(
  submissionId: any, 
  approvers: string[], 
  context: any
) {
  // Creer un workflow sequentiel
  for (let i = 0; i < approvers.length; i++) {
    await prisma.$executeRaw`
      INSERT INTO ApprovalTask (
        id, submissionId, approverRole, status, level, dueDate, createdAt
      ) VALUES (
        ${generateId()},
        ${submissionId},
        ${approvers[i]},
        ${i === 0 ? 'pending' : 'waiting'},
        ${i + 1},
        ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()},
        ${new Date().toISOString()}
      )
    `;
  }
}

async function getAIDecisionAnalysis(data: any): Promise<any> {
  try {
    // Appeler Ollama pour analyse
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: `Analyse cette decision strategique et fournis:
1. Points forts de la proposition (2-3 points)
2. Points de vigilance (2-3 points)
3. Recommandations d'amelioration (2-3 points)

Decision: ${data.decisionTitle}
Contexte: ${data.context}
Solution proposee: ${data.proposedSolution}
Risques identifies: ${data.risks}

Fournis une analyse concise et actionnable.`,
        stream: false,
      }),
    });

    if (response.ok) {
      const aiData = await response.json();
      return {
        analysis: aiData.response,
        confidence: 0.8,
      };
    }
  } catch (error) {
    console.error('Erreur analyse IA:', error);
  }

  return {
    analysis: 'Analyse IA non disponible',
    confidence: 0,
  };
}

function generateId(): string {
  return `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
