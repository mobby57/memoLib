import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const nextAuthSecret = process.env.NEXTAUTH_SECRET;

export async function getAuthToken(request: NextRequest) {
  return getToken({ req: request as any, secret: nextAuthSecret });
}
