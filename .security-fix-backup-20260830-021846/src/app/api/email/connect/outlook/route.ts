import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/email/connect/outlook
 * 
 * Redirige vers Microsoft OAuth pour autoriser l'accès Outlook/Office 365.
 * Scope: Mail.Read (lecture emails)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const baseUrl = process.env.NEXTAUTH_URL || 'https://memolib.space';

  if (!session?.user?.tenantId) {
    return NextResponse.redirect(`${baseUrl}/fr/auth/login`);
  }

  const clientId = process.env.AZURE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Microsoft OAuth non configuré (AZURE_CLIENT_ID manquant)' },
      { status: 503 }
    );
  }

  const redirectUri = `${baseUrl}/api/email/connect/outlook/callback`;
  const tenantId = process.env.AZURE_TENANT_ID || 'common'; // 'common' = multi-tenant (tous les comptes Microsoft)

  const scopes = [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read',
    'offline_access',
  ].join(' ');

  // State = tenantId + userId
  const state = Buffer.from(JSON.stringify({
    tenantId: (session.user as any).tenantId,
    userId: (session.user as any).id,
  })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    response_mode: 'query',
    state,
    prompt: 'consent',
  });

  const microsoftAuthUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  return NextResponse.redirect(microsoftAuthUrl);
}
