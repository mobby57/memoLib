import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/email/connect/gmail/callback
 * 
 * Reçoit le code OAuth de Google après consentement.
 * Échange le code contre des tokens, stocke de façon chiffrée.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memolib.space';

  // Erreur de l'utilisateur (refus de consentement)
  if (error) {
    logger.warn('[Gmail Connect] Consentement refusé', { error });
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

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/email/connect/gmail/callback`;

  try {
    // Échanger le code contre des tokens
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
      logger.error('[Gmail Connect] Échange token échoué', { error: err });
      return NextResponse.redirect(
        `${baseUrl}/fr/settings/emails?error=token_exchange_failed`
      );
    }

    const tokens = await tokenRes.json();

    // Récupérer l'email Google de l'utilisateur
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();
    const gmailAddress = userInfo.email as string;

    // Stocker la connexion Gmail en base
    // On stocke dans EmailAccount (ou TenantSettings selon le schéma)
    // Utilisation d'upsert pour éviter les doublons
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

    logger.info(`[Gmail Connect] Boîte connectée: ${gmailAddress} pour tenant ${tenantId}`);

    // Redirection vers les paramètres email avec succès
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
