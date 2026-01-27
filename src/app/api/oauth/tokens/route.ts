import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { oauthTokenService } from '@/lib/oauth/token-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/oauth/tokens
 * List all connected OAuth providers for current user
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const tokens = await oauthTokenService.listTokens(session.user.id);
    return NextResponse.json({ tokens }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'list_failed', detail: e?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/oauth/tokens?provider=google
 * Revoke OAuth token for a provider
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json({ error: 'provider requis' }, { status: 400 });
    }

    await oauthTokenService.revokeToken(
      session.user.id,
      provider as any,
      'User initiated revoke'
    );

    return NextResponse.json(
      { success: true, provider, message: 'Token revoked' },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'revoke_failed', detail: e?.message },
      { status: 500 }
    );
  }
}
