import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Le remplissage de données de démonstration en base est désactivé.' },
    { status: 410 }
  );
}
