import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/calendar/google-sync
 * Synchronise les deadlines MemoLib vers Google Calendar.
 */
export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { accessToken } = await req.json();

  if (!accessToken) {
    return NextResponse.json({ error: 'Google accessToken requis. Connectez votre Google Calendar.' }, { status: 400 });
  }

  // Recuperer les deadlines a venir
  const deadlines = await prisma.legalDeadline.findMany({
    where: { tenantId: user.tenantId, status: 'PENDING', dueDate: { gte: new Date() } },
    include: { dossier: { select: { numero: true, objet: true } } },
    orderBy: { dueDate: 'asc' },
    take: 50,
  });

  let synced = 0;

  for (const dl of deadlines) {
    try {
      const event = {
        summary: `[MemoLib] ${dl.label}`,
        description: `Dossier: ${dl.dossier?.numero || 'N/A'}\n${dl.dossier?.objet || ''}`,
        start: { dateTime: dl.dueDate.toISOString(), timeZone: 'Europe/Paris' },
        end: { dateTime: new Date(dl.dueDate.getTime() + 3600000).toISOString(), timeZone: 'Europe/Paris' },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }, { method: 'popup', minutes: 60 }] },
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (res.ok) synced++;
    } catch (e) { /* skip */ }
  }

  return NextResponse.json({ success: true, synced, total: deadlines.length });
}




