import { calendarService, type CalendarProvider } from '@/lib/calendar/calendar-service';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function resolveTenantAccess(requestedTenantId: string | null): Promise<
  | { tenantId: string }
  | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Non authentifie' }, { status: 401 }) };
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const sessionTenantId = (session.user as any).tenantId as string | undefined;

  if (role === 'SUPER_ADMIN') {
    if (!requestedTenantId) {
      return { error: NextResponse.json({ error: 'tenantId requis' }, { status: 400 }) };
    }
    return { tenantId: requestedTenantId };
  }

  if (!sessionTenantId) {
    return { error: NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 }) };
  }

  if (requestedTenantId && requestedTenantId !== sessionTenantId) {
    return { error: NextResponse.json({ error: 'Acces interdit' }, { status: 403 }) };
  }

  return { tenantId: sessionTenantId };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestedTenantId = String(body.tenantId || '').trim() || null;
    const provider = String(body.provider || 'ical').trim() as CalendarProvider;
    const token = body.token ? String(body.token) : undefined;

    const access = await resolveTenantAccess(requestedTenantId);
    if ('error' in access) {
      return access.error;
    }

    const tenantId = access.tenantId;
    const result = await calendarService.sync(tenantId, provider, token);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: 'sync_failed', detail: e?.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedTenantId = String(searchParams.get('tenantId') || '').trim() || null;
  const access = await resolveTenantAccess(requestedTenantId);
  if ('error' in access) {
    return access.error;
  }
  const tenantId = access.tenantId;

  const events = calendarService.listEvents(tenantId);
  return NextResponse.json({ events }, { status: 200 });
}
