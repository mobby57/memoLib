import { spawn } from 'node:child_process';

const APP_VERSION = process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0-dev';
const APP_COMMIT_SHA = process.env.APP_COMMIT_SHA || 'local-dev';
const BASE_URL = process.env.VERSION_CHECK_BASE_URL || 'http://127.0.0.1:3000';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollVersionEndpoint(maxAttempts = 40) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/version`);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Keep polling while the server boots.
    }
    await wait(1000);
  }
  throw new Error('Version endpoint did not become ready in time.');
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch. actual=${actual} expected=${expected}`);
  }
}

async function main() {
  const server = spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'start:prod'],
    {
      env: {
        ...process.env,
        APP_VERSION,
        NEXT_PUBLIC_APP_VERSION: APP_VERSION,
        APP_COMMIT_SHA,
        NODE_ENV: 'production',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  server.stdout.on('data', (data) => process.stdout.write(data));
  server.stderr.on('data', (data) => process.stderr.write(data));

  try {
    const payload = await pollVersionEndpoint();

    assertEqual('appVersion', payload.appVersion, APP_VERSION);
    assertEqual('commitSha', payload.commitSha, APP_COMMIT_SHA);

    console.log('[contract] Version handshake OK:', {
      appVersion: payload.appVersion,
      commitSha: payload.commitSha,
      apiVersion: payload.apiVersion,
    });
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error('[contract] Version handshake failed:', error.message);
  process.exit(1);
});
