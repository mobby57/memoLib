import { calendarService, type CalendarProvider } from '@/lib/calendar/calendar-service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tenantId = String(body.tenantId || '').trim();
    const provider = String(body.provider || 'ical').trim() as CalendarProvider;
    const token = body.token ? String(body.token) : undefined;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const result = await calendarService.sync(tenantId, provider, token);
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: 'sync_failed', detail: e?.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = String(searchParams.get('tenantId') || '').trim();
  if (!tenantId) return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });

  const events = calendarService.listEvents(tenantId);
  return NextResponse.json({ events }, { status: 200 });
}
