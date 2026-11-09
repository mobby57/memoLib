// This file configures the initialization of Sentry on the client.
// It is loaded by Next.js as the client instrumentation entry point.

// Only initialize Sentry if DSN is configured (graceful degradation)
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('./sentry.client.config');
}

export const onRouterTransitionStart = () => {
  // Hook called by Next.js on client-side navigation.
  // Sentry automatically instruments navigations via its integration,
  // so this hook is kept as a no-op to satisfy the framework contract.
};
