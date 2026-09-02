import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(_request: NextRequest) {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  return NextResponse.json(
    { error: 'Le mot de passe est géré par Clerk.' },
    { status: 410 }
  );
}
