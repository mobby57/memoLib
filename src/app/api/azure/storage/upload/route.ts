import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { getBlobServiceClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
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
    await container.createIfNotExists({ access: 'container' });

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
