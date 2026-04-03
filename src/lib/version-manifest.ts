export type VersionManifest = {
  appVersion: string;
  commitSha: string;
  buildTimeUtc: string;
  apiVersion: string;
};

// Single source of truth used by both frontend and API runtime.
export function getVersionManifest(): VersionManifest {
  return {
    appVersion: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0-dev',
    commitSha: process.env.APP_COMMIT_SHA || 'local-dev',
    buildTimeUtc: process.env.BUILD_TIME_UTC || new Date().toISOString(),
    apiVersion: process.env.API_VERSION || 'v1',
  };
}
