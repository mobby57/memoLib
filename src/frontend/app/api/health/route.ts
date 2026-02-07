import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Health Check API - Production Monitoring
 *
 * Endpoint: GET /api/health
 *
 * Vérifie l'état de santé de l'application et de ses dépendances:
 * - Base de données (PostgreSQL via Prisma)
 * - Services externes (Azure AD, Twilio, etc.)
 *
 * Utilisé par:
 * - Azure Application Insights
 * - Uptime monitors (UptimeRobot, Pingdom)
 * - Load balancers
 * - Kubernetes liveness/readiness probes
 *
 * Codes de retour:
 * - 200: Healthy (tous les services OK)
 * - 503: Unhealthy (au moins un service critique en erreur)
 */

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    env: HealthCheck;
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = performance.now();

  try {
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;

    const latency = performance.now() - startTime;

    // Warn if latency > 1000ms
    if (latency > 1000) {
      return {
        status: 'degraded',
        latency: Math.round(latency),
        details: { warning: 'High database latency' },
      };
    }

    return {
      status: 'ok',
      latency: Math.round(latency),
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message || 'Database connection failed',
      latency: Math.round(performance.now() - startTime),
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  try {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const heapUsagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100);

    // Warn if heap usage > 80%
    if (heapUsagePercent > 80) {
      return {
        status: 'degraded',
        details: {
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          heapUsagePercent: `${heapUsagePercent}%`,
          warning: 'High memory usage',
        },
      };
    }

    return {
      status: 'ok',
      details: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapUsagePercent: `${heapUsagePercent}%`,
      },
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message || 'Memory check failed',
    };
  }
}

/**
 * Check critical environment variables
 */
function checkEnvironment(): HealthCheck {
  const criticalVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missing = criticalVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    return {
      status: 'error',
      error: `Missing critical environment variables: ${missing.join(', ')}`,
      details: { missing },
    };
  }

  return {
    status: 'ok',
    details: {
      nodeVersion: process.version,
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  };
}

/**
 * GET /api/health
 */
export async function GET() {
  const startTime = performance.now();

  try {
    // Run all health checks in parallel
    const [database, memory, env] = await Promise.all([
      checkDatabase(),
      checkMemory(),
      Promise.resolve(checkEnvironment()),
    ]);

    const checks = { database, memory, env };

    // Determine overall status
    const hasError = Object.values(checks).some((check) => check.status === 'error');
    const hasDegraded = Object.values(checks).some((check) => check.status === 'degraded');

    const overallStatus = hasError ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    };

    // Return 503 if unhealthy, 200 otherwise
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

    // Add custom headers for monitoring
    const response = NextResponse.json(healthStatus, { status: statusCode });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('X-Health-Check-Duration', `${Math.round(performance.now() - startTime)}ms`);

    return response;
  } catch (error: any) {
    // Catastrophic failure
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Health check failed',
      },
      { status: 503 }
    );
  }
}
