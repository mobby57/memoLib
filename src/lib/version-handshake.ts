type VersionPayload = {
  appVersion?: string;
  commitSha?: string;
  apiVersion?: string;
};

export async function assertVersionHandshake(baseUrl = ''): Promise<void> {
  const expectedVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  if (!expectedVersion) {
    return;
  }

  const response = await fetch(`${baseUrl}/api/version`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Version endpoint unavailable: ${response.status}`);
  }

  const payload = (await response.json()) as VersionPayload;
  if (payload.appVersion !== expectedVersion) {
    throw new Error(
      `Frontend/Backend mismatch: frontend=${expectedVersion} backend=${payload.appVersion || 'unknown'}`
    );
  }
}
