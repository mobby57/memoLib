import { NextResponse } from 'next/server';
import { oauthService } from '@/lib/oauth/oauth-service';
import { type OAuthProvider } from '@/lib/oauth/oauth-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/authorize?provider=google&state=xxx&scopes=openid,profile
 * Génère une URL d'autorisation OAuth pour le provider demandé
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider');
  const state = searchParams.get('state');
  const scopesParam = searchParams.get('scopes');

  if (!provider || !state) {
    return NextResponse.json({ error: 'provider et state requis' }, { status: 400 });
  }

  try {
    const scopes = scopesParam ? scopesParam.split(',') : undefined;
    const authUrl = oauthService.getAuthorizationUrl(provider as OAuthProvider, state, scopes);

    return NextResponse.json({ authUrl }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: 'authorize_failed', detail: e?.message }, { status: 400 });
  }
}
