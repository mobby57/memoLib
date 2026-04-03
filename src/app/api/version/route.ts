import { NextResponse } from 'next/server';
import { getVersionManifest } from '@/lib/version-manifest';

export async function GET() {
  const manifest = getVersionManifest();
  const env = process.env.NODE_ENV || 'production';
  const previewProtected = process.env.PREVIEW_PROTECT === 'true';

  return NextResponse.json(
    {
      // Backward-compatible fields
      name: 'memolib',
      version: manifest.appVersion,
      commit: manifest.commitSha,
      timestamp: manifest.buildTimeUtc,
      env,
      previewProtected,

      // Contract fields for automated sync checks
      appVersion: manifest.appVersion,
      commitSha: manifest.commitSha,
      apiVersion: manifest.apiVersion,
      status: 'ok',
    },
    {
      status: 200,
      headers: {
        'x-app-version': manifest.appVersion,
        'x-commit-sha': manifest.commitSha,
      },
    }
  );
}
