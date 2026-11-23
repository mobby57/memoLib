import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  return NextResponse.json(
    { error: 'Cette transmission est désactivée. Utilisez le formulaire du portail client.' },
    { status: 410 }
  );
}
