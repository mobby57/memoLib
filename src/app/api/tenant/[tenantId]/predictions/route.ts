import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const predictions = await generatePredictions(tenantId);
    
    return NextResponse.json({
      success: true,
      ...predictions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}

async function generatePredictions(tenantId: string) {
  const baseRevenue = 15000 + Math.random() * 10000;
  const baseCaseload = 25 + Math.floor(Math.random() * 15);
  
  return {
    nextMonthRevenue: Math.round(baseRevenue),
    revenueTrend: (Math.random() - 0.5) * 20,
    caseloadForecast: baseCaseload,
    caseloadTrend: (Math.random() - 0.5) * 30,
    clientSatisfactionTrend: 85 + Math.random() * 10,
    resourceOptimization: 70 + Math.random() * 25,
    workloadAlerts: baseCaseload > 35 ? ['Charge de travail elevee prevue'] : [],
    optimizationSuggestions: [
      'Automatiser le triage des emails',
      'Optimiser les workflows de validation',
      'Améliorer la répartition des dossiers',
    ],
  };
}
