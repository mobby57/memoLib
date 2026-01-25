// API Route pour collecter les Web Vitals
// https://nextjs.org/docs/app/getting-started/route-handlers

import { NextRequest, NextResponse } from 'next/server';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

// Stockage en mémoire pour les métriques (en prod, utiliser une DB)
const metricsBuffer: WebVitalMetric[] = [];
const MAX_BUFFER_SIZE = 1000;

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();
    
    // Validation basique
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Ajouter au buffer
    metricsBuffer.push(metric);
    
    // Limiter la taille du buffer
    if (metricsBuffer.length > MAX_BUFFER_SIZE) {
      metricsBuffer.shift();
    }

    // Log pour monitoring
    if (metric.rating === 'poor') {
      console.warn(`[Web Vitals] Poor ${metric.name}: ${metric.value}`, {
        url: metric.url,
        timestamp: new Date(metric.timestamp).toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Web Vitals API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Retourner les statistiques agrégées
  const stats = {
    totalMetrics: metricsBuffer.length,
    byName: {} as Record<string, { count: number; avgValue: number; ratings: Record<string, number> }>,
  };

  for (const metric of metricsBuffer) {
    if (!stats.byName[metric.name]) {
      stats.byName[metric.name] = { count: 0, avgValue: 0, ratings: { good: 0, 'needs-improvement': 0, poor: 0 } };
    }
    const entry = stats.byName[metric.name];
    entry.avgValue = (entry.avgValue * entry.count + metric.value) / (entry.count + 1);
    entry.count++;
    entry.ratings[metric.rating]++;
  }

  return NextResponse.json(stats);
}
