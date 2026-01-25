import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { getSecretClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Missing required query param: name' }, { status: 400 });
    }

    const client = getSecretClient();
    const secret = await client.getSecret(name);

    logger.info('Key Vault: secret fetched', { rgpdCompliant: true, secretName: name });

    return NextResponse.json({ success: true, name, value: secret.value ?? null, properties: {
      enabled: secret.properties.enabled ?? undefined,
      createdOn: secret.properties.createdOn ?? undefined,
      updatedOn: secret.properties.updatedOn ?? undefined,
    }});
  } catch (error) {
    logger.error('Key Vault getSecret failed', error as any, { rgpdCompliant: true });
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
