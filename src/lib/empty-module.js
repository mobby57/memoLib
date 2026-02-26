// Empty module to replace Sentry on Azure builds
// This prevents the Html import error from @sentry/nextjs

module.exports = new Proxy({}, {
  get: function(target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return {};
    // Return a no-op function for any method call
    return function() { return Promise.resolve(); };
  }
});

// Also export as ESM
export default {};
export const init = () => {};
export const captureException = () => {};
export const captureMessage = () => {};
export const setUser = () => {};
export const setTag = () => {};
export const setExtra = () => {};
export const addBreadcrumb = () => {};
export const withSentryConfig = (config) => config;
