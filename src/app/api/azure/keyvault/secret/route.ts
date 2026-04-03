import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSecretClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth/server-session';

async function ensureAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const allowedRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const authError = await ensureAdminAccess();
    if (authError) {
      return authError;
    }

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
