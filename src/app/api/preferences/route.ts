import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (user as any).id;
  const prefs = await prisma.userPreference.findMany({ where: { userId } });

  const result: Record<string, any> = {};
  for (const p of prefs) {
    try { result[p.key] = JSON.parse(p.value); } catch { result[p.key] = p.value; }
  }
  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (user as any).id;
  const tenantId = (user as any).tenantId || '';
  const body = await request.json();
  const { key, value } = body;

  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 });

  const pref = await prisma.userPreference.upsert({
    where: { userId_key: { userId, key } },
    update: { value: JSON.stringify(value) },
    create: { userId, tenantId, key, value: JSON.stringify(value) },
  });

  return NextResponse.json({ key: pref.key, value: JSON.parse(pref.value) });
}




