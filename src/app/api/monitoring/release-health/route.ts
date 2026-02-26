import { getReleaseHealthDashboardUrl } from '@/lib/sentry-release-health';
import { NextResponse } from 'next/server';

/**
 * GET /api/monitoring/release-health
 * Displays Release Health dashboard URL and configuration
 */
export async function GET() {
  const dashboardUrl = getReleaseHealthDashboardUrl();

  return NextResponse.json({
    status: 'Release Health Monitoring Active',
    project: 'memolib-prod',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    features: {
      sessionTracking: 'enabled (auto)',
      crashDetection: 'enabled',
      adoptionTracking: 'enabled',
      replayRecording: 'enabled',
      webhookMetrics: 'enabled',
    },
    dashboardUrl,
    config: {
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
      sessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaySessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      attachStacktrace: true,
      maxBreadcrumbs: 50,
    },
    webhookMetrics: {
      tracked: [
        'webhook_success_email',
        'webhook_success_whatsapp',
        'webhook_success_sms',
        'webhook_success_form',
        'webhook_duplicate_*',
        'webhook_error_*',
      ],
      description: 'All webhook channels are monitored for health, crashes, and adoption',
    },
    releaseHealthLinks: {
      dashboard: dashboardUrl,
      issues: 'https://sentry.io/organizations/memolib/issues/?project=memolib-prod',
      releases: 'https://sentry.io/organizations/memolib/releases/?project=memolib-prod',
      performance: 'https://sentry.io/organizations/memolib/performance/?project=memolib-prod',
      healthcheck: 'https://sentry.io/organizations/memolib/releases/?project=memolib-prod',
    },
    nextSteps: [
      'Open Release Health dashboard in Sentry',
      'Monitor webhook metrics: email, whatsapp, sms, form channels',
      'Track crash-free sessions/users percentage',
      'Monitor adoption trends across releases',
      'Review session replays for error cases',
    ],
  });
}
