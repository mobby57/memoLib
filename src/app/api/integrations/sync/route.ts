import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { ExternalCalendarBridge } from '@/lib/oauth/calendar-bridge';
import type { OAuthProvider } from '@/lib/oauth/oauth-service';
import { oauthTokenService } from '@/lib/oauth/token-service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/sync?provider=google
 * Trigger sync from external calendar to MemoLib
 */
export async function POST(req: Request) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') as OAuthProvider;
    const type = searchParams.get('type') || 'calendar'; // 'calendar' | 'contacts'

    if (!provider) {
      return NextResponse.json({ error: 'provider requis' }, { status: 400 });
    }

    // Get valid token
    const accessToken = await oauthTokenService.ensureValidToken(user.id, provider);

    let result: any = {};

    if (type === 'calendar') {
      if (provider === 'google') {
        result = await ExternalCalendarBridge.syncGoogleCalendar(accessToken, user.id);
      } else if (provider === 'microsoft') {
        result = await ExternalCalendarBridge.syncMicrosoftCalendar(accessToken, user.id);
      }
    } else if (type === 'contacts') {
      if (provider === 'google') {
        result = await ExternalCalendarBridge.syncGoogleContacts(accessToken);
      } else if (provider === 'microsoft') {
        result = await ExternalCalendarBridge.syncMicrosoftContacts(accessToken);
      }
    }

    return NextResponse.json(
      { success: true, provider, type, synced: Array.isArray(result) ? result.length : 0 },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'sync_failed', detail: e?.message }, { status: 400 });
  }
}




