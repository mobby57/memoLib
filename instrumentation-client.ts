// This file configures the initialization of Sentry on the client.
// Disabled for Cloudflare/Azure Static Web Apps builds to avoid Html import errors

// Empty export to prevent any Sentry-related code from running during build
export {};

// Provide a no-op hook to satisfy Sentry/Next.js expectations during build.
export const onRouterTransitionStart = () => {};

// Sentry client initialization is disabled to avoid build errors
// with Next.js 15 static page generation.
// If you need Sentry, enable it only in production after deployment.
