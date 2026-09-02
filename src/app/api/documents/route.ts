import { GET as listDocuments, POST as uploadDocument } from '@/app/api/documents/upload/route';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy entry point retained for API compatibility. Centralizing it on the
 * canonical handler prevents it from bypassing upload validation and dossier
 * authorization.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return uploadDocument(request);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return listDocuments(request);
}
