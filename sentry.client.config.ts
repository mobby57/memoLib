import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Release & Environment for Release Health
  release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
  environment: process.env.NODE_ENV,

  // Performance & Tracing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session & Release Health tracking
  autoSessionTracking: true,
  sessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1,

  // Error handling
  attachStacktrace: true,
  maxBreadcrumbs: 50,
  debug: false,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event, hint) {
    // Tag release health events
    if (!event.tags) {
      event.tags = {};
    }
    event.tags['release_health'] = 'true';

    // Log critical errors
    if (event.exception) {
      const level = event.level;
      if (level === 'fatal' || level === 'error') {
        console.error('[Sentry] Captured error:', {
          level,
          message: event.message,
          tags: event.tags,
        });
      }
    }

    return event;
  },
});
