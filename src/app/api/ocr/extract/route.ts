import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextResponse } from 'next/server';

/**
 * OCR remains disabled until its local processing environment is verified.
 */
export async function POST() {
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  return NextResponse.json(
    { error: 'OCR désactivé jusqu’à validation du traitement local' },
    { status: 503 }
  );
}
