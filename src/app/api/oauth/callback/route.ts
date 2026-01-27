import { NextResponse } from 'next/server';
import { oauthService, type OAuthProvider } from '@/lib/oauth/oauth-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/oauth/callback
 * Échange le code d'autorisation pour un token d'accès
 * Body: { provider, code }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, code } = body;

    if (!provider || !code) {
      return NextResponse.json(
        { error: 'provider et code requis' },
        { status: 400 }
      );
    }

    const result = await oauthService.exchangeCode(provider as OAuthProvider, code);

    // TODO: Store accessToken + refreshToken in database with user session
    // const session = await getServerSession();
    // if (session?.user) {
    //   await db.oauthToken.upsert({
    //     where: { userId_provider: { userId: session.user.id, provider } },
    //     update: { accessToken: result.accessToken, refreshToken: result.refreshToken },
    //     create: { userId: session.user.id, provider, accessToken: result.accessToken, refreshToken: result.refreshToken },
    //   });
    // }

    return NextResponse.json({
      success: true,
      expiresIn: result.expiresIn,
      // accessToken should NOT be returned to client, only stored server-side
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'callback_failed', detail: e?.message },
      { status: 400 }
    );
  }
}
