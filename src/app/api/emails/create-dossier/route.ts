import { NextResponse } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';

export async function POST() {
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  if (!session.user.tenantId) {
    return NextResponse.json({ error: 'Cabinet requis' }, { status: 403 });
  }

  return NextResponse.json(
    { error: 'Création de dossier depuis un email temporairement indisponible. Vérifiez les échéances manuellement.' },
    { status: 503 },
  );
}
