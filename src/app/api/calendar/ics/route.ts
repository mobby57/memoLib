import { calendarService } from '@/lib/calendar/calendar-service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/calendar/ics?tenantId=xxx
 * Génère un flux ICS téléchargeable (iCal)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = String(searchParams.get('tenantId') || '').trim();

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
  }

  const ics = calendarService.generateICS(tenantId);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="memoLib-${tenantId}.ics"`,
    },
  });
}
