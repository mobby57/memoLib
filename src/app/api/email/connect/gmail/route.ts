import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/email/connect/gmail
 * 
 * Redirige vers Google OAuth pour autoriser l'accès Gmail (lecture emails).
 * Flow séparé de l'auth NextAuth — sert uniquement à connecter la boîte mail.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const baseUrl = process.env.NEXTAUTH_URL || 'https://memolib.space';
  
  if (!session?.user?.tenantId) {
    return NextResponse.redirect(`${baseUrl}/fr/auth/login`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth non configuré (GOOGLE_CLIENT_ID manquant)' },
      { status: 503 }
    );
  }

  const redirectUri = `${baseUrl}/api/email/connect/gmail/callback`;

  // Scopes Gmail en lecture seule
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ');

  // State = tenantId + userId (pour retrouver l'utilisateur au callback)
  const state = Buffer.from(JSON.stringify({
    tenantId: session.user.tenantId,
    userId: session.user.id,
  })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline', // Pour obtenir un refresh_token
    prompt: 'consent',      // Forcer le consentement pour le refresh_token
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
