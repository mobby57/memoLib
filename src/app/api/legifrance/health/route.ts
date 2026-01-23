/**
 * API Légifrance Health Check
 * Endpoint public pour vérifier que les clés PISTE sont configurées
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.PISTE_SANDBOX_CLIENT_ID;
  const clientSecret = process.env.PISTE_SANDBOX_CLIENT_SECRET;
  const oauthUrl = process.env.PISTE_SANDBOX_OAUTH_URL || 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token';
  const apiUrl = process.env.PISTE_SANDBOX_API_URL || 'https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app';
  const environment = process.env.PISTE_ENVIRONMENT || 'sandbox';

  // Vérifier configuration
  if (!clientId || !clientSecret) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Clés PISTE non configurées',
      environment,
    }, { status: 503 });
  }

  try {
    // Tester l'authentification OAuth
    const tokenResponse = await fetch(oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return NextResponse.json({
        status: 'auth_failed',
        message: 'Échec authentification OAuth',
        error: error.substring(0, 200),
        environment,
      }, { status: 502 });
    }

    const tokenData = await tokenResponse.json();

    // Test rapide de l'API
    const testResponse = await fetch(`${apiUrl}/list/code`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageNumber: 1,
        pageSize: 1,
      }),
    });

    const apiOk = testResponse.ok;

    return NextResponse.json({
      status: 'ok',
      message: 'API PISTE opérationnelle',
      environment,
      oauth: {
        connected: true,
        expiresIn: tokenData.expires_in,
      },
      api: {
        connected: apiOk,
        url: apiUrl,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      environment,
    }, { status: 500 });
  }
}
