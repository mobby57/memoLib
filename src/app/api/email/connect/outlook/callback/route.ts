import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { EncryptionService } from '@/lib/security/encryption';

/**
 * GET /api/email/connect/outlook/callback
 * 
 * Reçoit le code OAuth de Microsoft après consentement.
 * Échange le code contre des tokens, stocke en base.
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memolib.space';
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    logger.warn('[Outlook Connect] Consentement refusé', { error });
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=consent_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=invalid_callback`);
  }

  // Décoder le state
  let tenantId: string;
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    tenantId = decoded.tenantId;
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=invalid_state`);
  }

  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;
  const azureTenantId = process.env.AZURE_TENANT_ID || 'common';
  const redirectUri = `${baseUrl}/api/email/connect/outlook/callback`;

  try {
    // Échanger le code contre des tokens
    const tokenRes = await fetch(`https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read offline_access',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      logger.error('[Outlook Connect] Token exchange failed', { error: err });
      return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();

    // Récupérer l'email Microsoft
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    const outlookEmail = profile.mail || profile.userPrincipalName;

    // EMAIL-SEC-001: chiffrer les tokens au repos (AES-256-GCM).
    const encAccess = EncryptionService.encrypt(tokens.access_token);
    const encRefresh = tokens.refresh_token
      ? EncryptionService.encrypt(tokens.refresh_token)
      : null;

    // Stocker la connexion en base
    await prisma.emailAccount.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: outlookEmail,
        },
      },
      update: {
        provider: 'outlook',
        accessToken: encAccess,
        refreshToken: encRefresh || undefined,
        tokenExpiry: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        email: outlookEmail,
        provider: 'outlook',
        accessToken: encAccess,
        refreshToken: encRefresh,
        tokenExpiry: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    logger.info(`[Outlook Connect] Boîte connectée: ${outlookEmail} pour tenant ${tenantId}`);

    return NextResponse.redirect(
      `${baseUrl}/fr/dashboard?connected=email&provider=outlook`
    );
  } catch (error) {
    logger.error('[Outlook Connect] Erreur callback', error);
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=server_error`);
  }
}
