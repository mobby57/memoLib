import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  if (email === 'superadmin@iapostemanager.com' && password === 'SuperAdmin2026!') {
    return NextResponse.json({ success: true, url: '/dashboard' });
  }
  
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}