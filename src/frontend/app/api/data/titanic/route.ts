import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BACKEND_URL = 'http://localhost:5000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const backendUrl = process.env.PY_BACKEND_URL || DEFAULT_BACKEND_URL;

    const response = await fetch(`${backendUrl}/api/data/titanic/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': contentType },
    });
  } catch (error: any) {
    console.error('Titanic prepare error:', error);
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 500 });
  }
}
