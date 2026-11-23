import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'La simulation des emails est locale au navigateur et ne crée aucun email réel.' },
    { status: 410 }
  );
}
