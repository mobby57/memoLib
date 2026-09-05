import { GET as downloadDocument } from '@/app/api/documents/download/[id]/route';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  id: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

/**
 * Compatibility endpoint for the document page. It delegates to the canonical
 * route so query-string downloads receive the same tenant, dossier permission,
 * antivirus, rate-limit, and storage-path protections.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const query = querySchema.safeParse({ id: request.nextUrl.searchParams.get('id') });
  if (!query.success) {
    return NextResponse.json({ error: 'ID document invalide' }, { status: 400 });
  }

  return downloadDocument(request, { params: Promise.resolve({ id: query.data.id }) });
}
