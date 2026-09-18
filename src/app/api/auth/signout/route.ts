import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Next 15 : cookies() est async
  const jar = await cookies();
  jar.delete('session');
  jar.delete('next-auth.session-token');
  jar.delete('__Secure-next-auth.session-token');
  return NextResponse.json({ ok: true });
}
