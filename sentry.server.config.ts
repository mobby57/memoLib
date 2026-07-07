import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Release & Environment for Release Health
  release: process.env.APP_VERSION || '0.1.0',
  environment: process.env.NODE_ENV,

  // Performance & Tracing (Request-mode sessions)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

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

    // 🔒 PII Scrubbing — Ne jamais envoyer de données client à Sentry
    if (event.exception?.values) {
      for (const exception of event.exception.values) {
        if (exception.value) {
          // Redact emails
          exception.value = exception.value.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            '[EMAIL_REDACTED]'
          );
          // Redact phone numbers
          exception.value = exception.value.replace(
            /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/g,
            '[TEL_REDACTED]'
          );
          // Redact potential names after common patterns
          exception.value = exception.value.replace(
            /(?:client|avocat|user|nom|name)[\s:=]+["']?[A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s[A-ZÀ-Ÿ][a-zà-ÿ]+)?["']?/gi,
            '[NOM_REDACTED]'
          );
        }
      }
    }

    // Scrub breadcrumbs (may contain form data, URLs with emails, etc.)
    if (event.breadcrumbs) {
      for (const breadcrumb of event.breadcrumbs) {
        if (breadcrumb.message) {
          breadcrumb.message = breadcrumb.message.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            '[EMAIL_REDACTED]'
          );
        }
        if (breadcrumb.data) {
          // Remove potential PII from breadcrumb data
          delete breadcrumb.data.body;
          delete breadcrumb.data.request_body;
        }
      }
    }

    // Remove request body from context (may contain client data)
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }

    // Filter out expected client errors (400, 415)
    const message = event.message || '';
    const errorMessage = hint?.originalException instanceof Error
      ? hint.originalException.message
      : String(hint?.originalException || '');

    const ignoredPatterns = [
      'JSON at position',
      'Corps de requête invalide',
      'Content-Type application/json requis',
      'Unexpected token',
      'Unexpected end of JSON',
    ];

    if (ignoredPatterns.some((p) => message.includes(p) || errorMessage.includes(p))) {
      return null; // Drop event — not a real error
    }

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
