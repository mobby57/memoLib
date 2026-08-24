import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

// Only initialize Sentry if a valid DSN is configured (aligned with sentry.server.config.ts)
if (dsn && !dsn.includes('your-key')) {
  Sentry.init({
    dsn,

    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    debug: false,

    environment: process.env.NODE_ENV,

    beforeSend(event) {
      // 🔒 PII Scrubbing — Ne jamais envoyer de données client à Sentry (edge runtime)
      if (event.exception?.values) {
        for (const exception of event.exception.values) {
          if (exception.value) {
            exception.value = exception.value.replace(
              /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
              '[EMAIL_REDACTED]'
            );
          }
        }
      }
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
      }
      return event;
    },
  });
}
