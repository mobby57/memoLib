import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return NextResponse.redirect(new URL(`/api/factures/${params.id}/pdf`, req.url));
}
