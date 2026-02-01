/**
 * API Apprentissage Continu IA
 * Endpoint: /api/tenant/[tenantId]/learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { LearningService } from '@/lib/services/learningService';
import { logger } from '@/lib/logger';

interface LearningParams {
  params: { tenantId: string };
}

export async function GET(
  request: NextRequest,
  { params }: LearningParams
) {
  try {
    const { tenantId } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analyze';
    const period = parseInt(searchParams.get('period') || '30');

    switch (action) {
      case 'analyze':
        const analysis = await LearningService.analyzeValidationPatterns(tenantId, period);
        return NextResponse.json(analysis);

      case 'report':
        const report = await LearningService.generateImprovementReport(tenantId);
        return NextResponse.json(report);

      case 'adjustments':
        const adjustments = await LearningService.applyConfidenceAdjustments(tenantId);
        return NextResponse.json(adjustments);

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Erreur learning service', { error, tenantId: params.tenantId });
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse d\'apprentissage' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: LearningParams
) {
  try {
    const { tenantId } = params;
    const body = await request.json();
    const { actionType, confidence } = body;

    if (!actionType || confidence === undefined) {
      return NextResponse.json(
        { error: 'actionType et confidence requis' },
        { status: 400 }
      );
    }

    const prediction = await LearningService.predictApprovalProbability(
      tenantId,
      actionType,
      confidence
    );

    return NextResponse.json(prediction);

  } catch (error) {
    logger.error('Erreur prediction learning', { error, tenantId: params.tenantId });
    return NextResponse.json(
      { error: 'Erreur lors de la prediction' },
      { status: 500 }
    );
  }
}