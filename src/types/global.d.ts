/* eslint-disable @typescript-eslint/no-explicit-any */

// Global augmentations for MemoLib

// Sentry global reference (used in instrumentation files)
declare global {
  // eslint-disable-next-line no-var
  var Sentry: any;
}

export {};
