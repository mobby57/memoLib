/**
 * Test API Endpoint - CESEDA Case Analysis
 *
 * Example endpoint demonstrating:
 * - Tenant isolation
 * - AI integration (Ollama)
 * - RGPD-compliant logging
 * - Proper error handling
 *
 * POST /api/test/ceseda-analysis
 */

import { cesedaAnalyzer } from '@/lib/ai/ceseda-analyzer';
import { logger, logIAUsage } from '@/lib/logger';
import { anonymizeForAI } from '@/lib/utils/rgpd-helpers';
import { NextRequest, NextResponse } from 'next/server';

async function handler(req: NextRequest, context: any) {
  try {
    const body = await req.json();

    const { caseType, clientSituation, documents, notificationDate } = body;

    // Validate required fields
    if (!caseType || !clientSituation) {
      return NextResponse.json(
        { error: 'Missing required fields: caseType, clientSituation' },
        { status: 400 }
      );
    }

    // Anonymize client data before AI processing (RGPD compliance)
    const anonymizedSituation = anonymizeForAI({
      situation: clientSituation,
    }).situation;

    logger.info('Starting CESEDA case analysis', {
      tenantId: context.tenantId,
      userId: context.userId,
      caseType,
      documentCount: documents?.length || 0,
    });

    // Perform AI analysis
    const analysis = await cesedaAnalyzer.analyzeCase({
      caseType,
      clientSituation: anonymizedSituation,
      documents: documents || [],
      notificationDate: notificationDate ? new Date(notificationDate) : undefined,
    });

    // Log AI usage for audit trail
    logIAUsage('ANALYSIS', context.userId, context.tenantId, 'test-dossier', {
      caseType,
      confidence: analysis.confidence,
      riskLevel: analysis.riskLevel,
      dataAnonymized: true,
    });

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        tenantId: context.tenantId,
        timestamp: new Date().toISOString(),
        aiModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
      },
    });
  } catch (error) {
    logger.error('CESEDA analysis failed', error, {
      tenantId: context.tenantId,
      userId: context.userId,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export handler
export { handler as POST };
