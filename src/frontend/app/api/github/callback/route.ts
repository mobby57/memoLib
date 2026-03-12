import { getGitHubApp } from '@/lib/github-app';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint OAuth callback GitHub
 * GET /api/github/callback
 *
 * Gère le retour OAuth pour l'authentification utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Vérifier les erreurs OAuth
    if (error) {
      console.error('[GitHub OAuth] Error:', error);
      return NextResponse.redirect(new URL('/?error=github_oauth_failed', req.url));
    }

    // Vérifier le code
    if (!code) {
      console.error('[GitHub OAuth] Missing code parameter');
      return NextResponse.redirect(new URL('/?error=missing_code', req.url));
    }

    // TODO: Vérifier le state CSRF token

    // Échanger le code contre un access token
    const app = getGitHubApp();
    const tokenResponse = await app.oauth.createToken({
      code,
    });
    const token =
      (tokenResponse as any).token || (tokenResponse as any).authentication?.token || null;

    console.log('[GitHub OAuth] Token obtained successfully');

    // TODO: Stocker le token en session
    // TODO: Récupérer les infos utilisateur
    // TODO: Lier à l'utilisateur MemoLib

    // Rediriger vers le dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    console.error('[GitHub OAuth] Error in callback:', error);
    return NextResponse.redirect(new URL('/?error=oauth_error', req.url));
  }
}
