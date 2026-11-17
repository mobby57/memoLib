import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Cette route n’est plus disponible. Utilisez le dépôt sécurisé des documents.' },
    { status: 410 }
  );
}
