/**
 * Sentry Release Health Configuration
 * Tracks sessions, crashes, and adoption metrics for memolib-prod
 */

import * as Sentry from '@sentry/nextjs';

export interface HealthMetrics {
  sessionId: string;
  status: 'healthy' | 'errored' | 'abnormal' | 'crashed';
  duration: number;
  errors: number;
  breadcrumbs: number;
  userId?: string;
}

/**
 * Capture a session health event
 * Use this to manually track session health outside automatic tracking
 */
export function captureSessionHealth(metrics: Partial<HealthMetrics>): void {
  Sentry.captureMessage('[Session Health]', {
    level: 'info',
    tags: {
      'release_health': 'true',
      'session_status': metrics.status || 'unknown',
      'channel': 'session_monitor',
    },
    contexts: {
      session: {
        session_id: metrics.sessionId,
        status: metrics.status,
        duration: metrics.duration,
        error_count: metrics.errors,
        breadcrumb_count: metrics.breadcrumbs,
      },
    },
  });
}

/**
 * Capture webhook processing health
 * Called by webhook handlers to track multi-channel message processing
 */
export function captureWebhookHealth(
  channel: string,
  status: 'success' | 'error' | 'duplicate',
  duration: number,
  messageId?: string,
  error?: Error,
): void {
  const level = status === 'error' ? 'error' : status === 'duplicate' ? 'warning' : 'info';

  if (error && status === 'error') {
    Sentry.captureException(error, {
      tags: {
        'release_health': 'true',
        'webhook_channel': channel,
        'webhook_status': status,
      },
      contexts: {
        webhook: {
          channel,
          status,
          duration_ms: duration,
          message_id: messageId,
        },
      },
    });
  } else {
    Sentry.captureMessage(`[Webhook] ${channel} ${status}`, {
      level,
      tags: {
        'release_health': 'true',
        'webhook_channel': channel,
        'webhook_status': status,
      },
      contexts: {
        webhook: {
          channel,
          status,
          duration_ms: duration,
          message_id: messageId,
        },
      },
    });
  }
}

/**
 * Track crash rate for a specific channel
 * Use in webhook error handlers
 */
export function trackChannelCrash(
  channel: string,
  error: Error,
  context?: Record<string, unknown>,
): void {
  Sentry.captureException(error, {
    level: 'fatal',
    tags: {
      'release_health': 'true',
      'channel': channel,
      'event_type': 'crash',
    },
    contexts: {
      crash: {
        channel,
        ...context,
      },
    },
  });
}

/**
 * Track user adoption metrics
 * Call this on successful user operations (login, message send, etc.)
 */
export function trackUserAdoption(userId: string, action: string): void {
  Sentry.setUser({
    id: userId,
    username: userId,
  });

  Sentry.captureMessage(`[Adoption] ${action}`, {
    level: 'info',
    tags: {
      'release_health': 'true',
      'adoption_event': action,
    },
  });
}

/**
 * Track custom release health metric
 * For detailed metrics beyond standard session tracking
 */
export function trackMetric(
  name: string,
  value: number,
  unit: string = 'count',
  tags?: Record<string, string>,
): void {
  Sentry.captureMessage(`[Metric] ${name}: ${value}${unit}`, {
    level: 'info',
    tags: {
      'release_health': 'true',
      'metric_name': name,
      'metric_unit': unit,
      ...tags,
    },
    contexts: {
      metric: {
        name,
        value,
        unit,
      },
    },
  });
}

/**
 * Get current session info
 * Returns details about the active session
 */
export function getSessionInfo(): Record<string, unknown> {
  const session = Sentry.getSession();
  return session
    ? {
        id: session.sessionId,
        status: session.status,
        started: session.started,
        duration: session.duration,
        errors: session.errors,
      }
    : { none: true };
}

/**
 * Check release health dashboard
 * Returns URL to view release health in memolib-prod dashboard
 */
export function getReleaseHealthDashboardUrl(): string {
  return 'https://sentry.io/organizations/memolib/releases/?project=memolib-prod';
}

export default {
  captureSessionHealth,
  captureWebhookHealth,
  trackChannelCrash,
  trackUserAdoption,
  trackMetric,
  getSessionInfo,
  getReleaseHealthDashboardUrl,
};
