import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { getBlobServiceClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') ?? undefined;
    const take = Math.min(Number(url.searchParams.get('take') ?? '50'), 500);

    const containerName = process.env.AZURE_STORAGE_CONTAINER;
    if (!containerName) {
      return NextResponse.json({ error: 'Missing AZURE_STORAGE_CONTAINER' }, { status: 500 });
    }

    const blobService = getBlobServiceClient();
    const container = blobService.getContainerClient(containerName);

    const blobs: Array<{ name: string; size?: number; contentType?: string }> = [];
    let i = 0;
    for await (const item of container.listBlobsFlat({ prefix })) {
      blobs.push({
        name: item.name,
        size: item.properties.contentLength,
        contentType: item.properties.contentType,
      });
      i += 1;
      if (i >= take) break;
    }

    logger.info('Azure Storage: listed blobs', {
      rgpdCompliant: true,
      count: blobs.length,
      prefix: prefix ?? null,
    });

    return NextResponse.json({ success: true, container: containerName, count: blobs.length, blobs });
  } catch (error) {
    logger.error('Azure Storage list failed', error as any, { rgpdCompliant: true });
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
