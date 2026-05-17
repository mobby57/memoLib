// This file exists for compatibility — actual logic is in instrumentation.ts
// Next.js resolves .ts over .js when both exist, but we keep this as a safety net.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
