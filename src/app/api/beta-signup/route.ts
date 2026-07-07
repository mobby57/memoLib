import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide. JSON attendu.' }, { status: 400 });
  }

  const { email, name, cabinet, size } = body as { email?: string; name?: string; cabinet?: string; size?: string };

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  try {
    // Stocker dans une table simple ou utiliser un modèle existant
    await prisma.$executeRaw`
      INSERT INTO "BetaSignup" (email, name, cabinet, size, "createdAt")
      VALUES (${email}, ${name || null}, ${cabinet || null}, ${size || null}, NOW())
      ON CONFLICT (email) DO NOTHING
    `;
    return NextResponse.json({ success: true });
  } catch {
    // Table n'existe pas encore — fallback log
    console.log('[BETA SIGNUP]', { email, name, cabinet, size, date: new Date().toISOString() });
    return NextResponse.json({ success: true });
  }
}
