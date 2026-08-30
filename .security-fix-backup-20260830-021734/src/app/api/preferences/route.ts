import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const prefs = await prisma.userPreference.findMany({ where: { userId } });

  const result: Record<string, any> = {};
  for (const p of prefs) {
    try { result[p.key] = JSON.parse(p.value); } catch { result[p.key] = p.value; }
  }
  return NextResponse.json(result);
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const tenantId = (session.user as any).tenantId || '';
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
