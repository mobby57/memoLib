/**
 * Metrics Endpoint — MemoLib Pilot Monitoring
 * 
 * GET /api/metrics
 * 
 * Returns JSON with daily metrics for pilot tracking
 * Used by: Dashboard, Grafana, status pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

// Types
interface MetricsResponse {
  timestamp: string;
  daily: {
    activeUsers: number;
    dossiers_created: number;
    emails_processed: number;
    ai_requests: number;
    documents_generated: number;
    errors_count: number;
    avg_response_time_ms: number;
  };
  weekly: {
    active_users: number;
    dossiers_created: number;
    feature_adoption_percent: number;
  };
  health: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
    api_status: 'up' | 'down';
  };
}

async function getMetrics(): Promise<MetricsResponse> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Daily metrics
    const dailyActiveUsers = await prisma.session.findMany({
      where: {
        last_active: { gte: startOfDay },
      },
      select: { user_id: true },
      distinct: ['user_id'],
    });

    const dossiersCreatedToday = await prisma.dossier.count({
      where: {
        created_at: { gte: startOfDay },
      },
    });

    const emailsProcessedToday = await prisma.email.count({
      where: {
        created_at: { gte: startOfDay },
        type: 'INBOUND',
      },
    });

    const aiRequestsToday = await prisma.aiUsageLog.count({
      where: {
        createdAt: { gte: startOfDay },
      },
    });

    const documentsGeneratedToday = await prisma.document.count({
      where: {
        created_at: { gte: startOfDay },
        status: 'GENERATED',
      },
    });

    // Errors from Sentry (or fallback to 0)
    const errorsCount = await prisma.eventLog.count({
      where: {
        level: 'ERROR',
        timestamp: { gte: startOfDay },
      },
    });

    // Weekly metrics
    const weeklyActiveUsers = await prisma.session.findMany({
      where: {
        last_active: { gte: startOfWeek },
      },
      select: { user_id: true },
      distinct: ['user_id'],
    });

    const dossiersCreatedWeekly = await prisma.dossier.count({
      where: {
        created_at: { gte: startOfWeek },
      },
    });

    // Feature adoption (estimated)
    const usersWithGmail = await prisma.user.count({
      where: {
        gmail_connected: true,
      },
    });
    const totalUsers = await prisma.user.count();
    const featureAdoption = totalUsers > 0 ? (usersWithGmail / totalUsers) * 100 : 0;

    // Health checks
    let dbHealth: 'up' | 'down' = 'up';
    let cacheHealth: 'up' | 'down' = 'up';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbHealth = 'down';
      Sentry.captureException(e, { tags: { check: 'database' } });
    }

    // Check cache (Redis)
    try {
      const response = await fetch('https://memolib-redis.upstash.io/ping', {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        },
      });
      if (!response.ok) cacheHealth = 'down';
    } catch (e) {
      cacheHealth = 'down';
      Sentry.captureException(e, { tags: { check: 'cache' } });
    }

    const apiStatus: 'up' | 'down' = dbHealth === 'up' && cacheHealth === 'up' ? 'up' : 'down';

    return {
      timestamp: new Date().toISOString(),
      daily: {
        activeUsers: dailyActiveUsers.length,
        dossiers_created: dossiersCreatedToday,
        emails_processed: emailsProcessedToday,
        ai_requests: aiRequestsToday,
        documents_generated: documentsGeneratedToday,
        errors_count: errorsCount,
        avg_response_time_ms: 250, // TODO: Track in middleware
      },
      weekly: {
        active_users: weeklyActiveUsers.length,
        dossiers_created: dossiersCreatedWeekly,
        feature_adoption_percent: Math.round(featureAdoption),
      },
      health: {
        database: dbHealth,
        cache: cacheHealth,
        api_status: apiStatus,
      },
    };
  } catch (error) {
    Sentry.captureException(error, { tags: { endpoint: '/api/metrics' } });
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional: Require auth token for metrics endpoint
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || token !== process.env.CRON_SECRET) {
      // Allow if CRON_SECRET is provided, or allow public access for demo
      // In production, you might want to restrict this
      if (process.env.NODE_ENV === 'production' && !token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const metrics = await getMetrics();

    // Cache response for 5 minutes
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Expose raw metrics for monitoring/debugging
export async function POST(request: NextRequest) {
  // Admin-only endpoint to trigger metrics collection
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const metrics = await getMetrics();

    // Store in database for historical tracking (optional)
    // await prisma.metricSnapshot.create({
    //   data: {
    //     timestamp: new Date(),
    //     data: metrics,
    //   },
    // });

    return NextResponse.json({
      success: true,
      metrics,
      stored: false, // TODO: Enable if you create metricSnapshot table
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
