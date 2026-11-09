import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { logger } from '@/lib/logger';

/**
 * GET /api/email/connect/gmail/callback
 * 
 * ReÃ§oit le code OAuth de Google aprÃ¨s consentement.
 * Ã‰change le code contre des tokens, stocke de faÃ§on chiffrÃ©e.
 */
export async function GET(request: NextRequest) {
  const prisma = await getSecurePrisma();
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL || 'https://memolib.space';

  // Erreur de l'utilisateur (refus de consentement)
  if (error) {
    logger.warn('[Gmail Connect] Consentement refusÃ©', { error });
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=consent_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=invalid_callback`);
  }

  // DÃ©coder le state
  let tenantId: string;
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    tenantId = decoded.tenantId;
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=invalid_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/email/connect/gmail/callback`;

  try {
    // Ã‰changer le code contre des tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      logger.error('[Gmail Connect] Ã‰change token Ã©chouÃ©', { error: err });
      return NextResponse.redirect(
        `${baseUrl}/fr/settings/emails?error=token_exchange_failed`
      );
    }

    const tokens = await tokenRes.json();

    // RÃ©cupÃ©rer l'email Google de l'utilisateur
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();
    const gmailAddress = userInfo.email as string;

    // Stocker la connexion Gmail en base
    // On stocke dans EmailAccount (ou TenantSettings selon le schÃ©ma)
    // Utilisation d'upsert pour Ã©viter les doublons
    await prisma.emailAccount.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: gmailAddress,
        },
      },
      update: {
        provider: 'gmail',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
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
        email: gmailAddress,
        provider: 'gmail',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    logger.info(`[Gmail Connect] BoÃ®te connectÃ©e: ${gmailAddress} pour tenant ${tenantId}`);

    // Redirection vers les paramÃ¨tres email avec succÃ¨s
    return NextResponse.redirect(
      `${baseUrl}/fr/settings/emails?success=gmail_connected&email=${encodeURIComponent(gmailAddress)}`
    );
  } catch (error) {
    logger.error('[Gmail Connect] Erreur callback', error);
    return NextResponse.redirect(
      `${baseUrl}/fr/settings/emails?error=server_error`
    );
  }
}

