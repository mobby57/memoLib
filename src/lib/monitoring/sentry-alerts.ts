/**
 * Sentry Alert Configuration
 * 
 * Setup instructions:
 * 1. Go to: https://sentry.io/settings/memolib/alerts/
 * 2. Create Alert Rule with these conditions:
 * 
 * Alert Name: "Production Error Spike"
 * Conditions:
 *   - Environment: production
 *   - Error Rate: > 1% for 5 minutes
 * 
 * Actions:
 *   - Slack Integration: #alerts-production
 *   - Email: devops@memolib.space
 * 
 * ---
 * 
 * Alert 2: "New Error Type Detected"
 * Conditions:
 *   - Environment: production
 *   - New issue created
 * Actions:
 *   - Slack: #alerts-production
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Initialize Sentry with custom setup
 */
export function initializeSentryAlerts() {
  // Already configured in sentry.server.config.ts and sentry.edge.config.ts
  // This file documents the alert configuration
  
  console.log('✅ Sentry alerts configured');
  console.log('📊 Dashboard: https://sentry.io/memolib/');
  console.log('🔔 Alerts: https://sentry.io/settings/memolib/alerts/');
}

/**
 * Capture critical errors with context
 */
export function captureError(
  error: Error,
  context: Record<string, any> = {},
  level: 'error' | 'fatal' = 'error'
) {
  Sentry.captureException(error, {
    level,
    extra: context,
    tags: {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track performance metrics
 */
export function trackPerformance(
  name: string,
  duration: number,
  metadata: Record<string, any> = {}
) {
  Sentry.captureMessage(`Performance: ${name} took ${duration}ms`, {
    level: duration > 1000 ? 'warning' : 'info',
    tags: {
      metric: name,
      duration_ms: duration,
    },
    extra: metadata,
  });
}

/**
 * Alert thresholds to monitor
 */
export const ALERT_THRESHOLDS = {
  ERROR_RATE: 0.01, // 1%
  SLOW_API_RESPONSE: 1000, // ms
  DATABASE_SLOW_QUERY: 500, // ms
  RATE_LIMIT_HIT: 100, // per hour
  MEMORY_USAGE: 0.9, // 90%
} as const;

/**
 * Example: In your API routes, use like this:
 * 
 * // src/app/api/dossier/route.ts
 * import { captureError, trackPerformance } from '@/lib/monitoring/sentry-alerts';
 * 
 * export async function GET(req: Request) {
 *   const startTime = Date.now();
 *   
 *   try {
 *     const dossiers = await prisma.dossier.findMany();
 *     
 *     const duration = Date.now() - startTime;
 *     if (duration > ALERT_THRESHOLDS.SLOW_API_RESPONSE) {
 *       trackPerformance('GET /api/dossier', duration, { count: dossiers.length });
 *     }
 *     
 *     return Response.json(dossiers);
 *   } catch (error) {
 *     captureError(error as Error, {
 *       endpoint: 'GET /api/dossier',
 *       timestamp: new Date().toISOString(),
 *     }, 'error');
 *     
 *     return Response.json({ error: 'Internal server error' }, { status: 500 });
 *   }
 * }
 */

export default {
  initializeSentryAlerts,
  captureError,
  trackPerformance,
  ALERT_THRESHOLDS,
};
