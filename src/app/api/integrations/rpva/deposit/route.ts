import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ available: false, comingSoon: true, message: 'Cette fonctionnalité sera disponible prochainement.' }, { status: 501 });
}
