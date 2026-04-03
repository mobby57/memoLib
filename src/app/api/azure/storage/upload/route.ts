import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getBlobServiceClient } from '@/lib/azure/clients';
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

export async function POST(request: Request) {
  try {
    const authError = await ensureAdminAccess();
    if (authError) {
      return authError;
    }

    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: 'Missing query param: name' }, { status: 400 });
    }

    const containerName = process.env.AZURE_STORAGE_CONTAINER;
    if (!containerName) {
      return NextResponse.json({ error: 'Missing AZURE_STORAGE_CONTAINER' }, { status: 500 });
    }

    const contentType = request.headers.get('content-type') || 'application/octet-stream';

    const body = await request.arrayBuffer();
    const buffer = Buffer.from(body);

    const blobService = getBlobServiceClient();
    const container = blobService.getContainerClient(containerName);
    await container.createIfNotExists();

    const blob = container.getBlockBlobClient(name);
    await blob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    logger.info('Azure Storage: uploaded blob', { rgpdCompliant: true, name, size: buffer.length });

    return NextResponse.json({ success: true, name, size: buffer.length }, { status: 201 });
  } catch (error) {
    logger.error('Azure Storage upload failed', error as any, { rgpdCompliant: true });
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
