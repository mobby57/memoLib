import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Release & Environment for Release Health
  release: process.env.APP_VERSION || '0.1.0',
  environment: process.env.NODE_ENV,

  // Performance & Tracing (Request-mode sessions)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session & Release Health tracking (Server-mode)
  autoSessionTracking: true,
  sessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Error handling
  attachStacktrace: true,
  maxBreadcrumbs: 50,
  debug: false,

  beforeSend(event, hint) {
    // Tag server-side release health events
    if (!event.tags) {
      event.tags = {};
    }
    event.tags['release_health'] = 'true';
    event.tags['server_mode'] = 'true';

    // Log critical errors
    if (event.exception) {
      const level = event.level;
      if (level === 'fatal' || level === 'error') {
        console.error('[Sentry Server] Captured error:', {
          level,
          message: event.message,
          tags: event.tags,
        });
      }
    }

    return event;
  },
});
