import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Release & Environment for Release Health
  release: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
  environment: process.env.NODE_ENV,

  // Performance & Tracing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

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
      // Ne jamais capturer de champs de formulaire (données client)
      maskAllInputs: true,
    }) as any,
  ],

  beforeSend(event, hint) {
    // Tag release health events
    if (!event.tags) {
      event.tags = {};
    }
    event.tags['release_health'] = 'true';

    // 🔒 PII Scrubbing côté client
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.value) {
          exception.value = exception.value.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            '[EMAIL_REDACTED]'
          );
          exception.value = exception.value.replace(
            /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g,
            '[TEL_REDACTED]'
          );
        }
      }
    }

    // Remove URL parameters (may contain tokens, emails)
    if (event.request?.url) {
      try {
        const url = new URL(event.request.url);
        url.searchParams.forEach((_, key) => {
          if (['email', 'token', 'code', 'name', 'tel'].some(k => key.toLowerCase().includes(k))) {
            url.searchParams.set(key, '[REDACTED]');
          }
        });
        event.request.url = url.toString();
      } catch { /* ignore malformed URLs */ }
    }

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
