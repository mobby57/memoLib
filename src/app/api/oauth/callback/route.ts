import { oauthService, type OAuthProvider } from '@/lib/oauth/oauth-service';
import { oauthTokenService } from '@/lib/oauth/token-service';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/oauth/callback
 * Échange le code d'autorisation pour un token d'accès
 * Body: { provider, code }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized', detail: 'No session found' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { provider, code } = body;

    if (!provider || !code) {
      return NextResponse.json({ error: 'provider et code requis' }, { status: 400 });
    }

    const result = await oauthService.exchangeCode(provider as OAuthProvider, code);

    // Store token in database
    await oauthTokenService.storeToken(session.user.id, {
      provider: provider as OAuthProvider,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });

    return NextResponse.json(
      {
        success: true,
        provider,
        expiresIn: result.expiresIn,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'callback_failed', detail: e?.message }, { status: 400 });
  }
}
