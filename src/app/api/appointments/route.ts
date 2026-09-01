import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
/**
 * GET /api/appointments/available
 * Retourne les creneaux disponibles pour un RDV.
 * 
 * POST /api/appointments/book
 * Reserve un creneau.
 */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const duration = parseInt(req.nextUrl.searchParams.get('duration') || '30');

  // Generer des creneaux disponibles (9h-18h, pas de pause dejeuner)
  const slots: string[] = [];
  const baseDate = new Date(date);

  for (let h = 9; h < 18; h++) {
    for (let m = 0; m < 60; m += duration) {
      if (h === 12 && m < 60) continue; // Pause dejeuner
      const slot = new Date(baseDate);
      slot.setHours(h, m, 0, 0);
      if (slot > new Date()) slots.push(slot.toISOString());
    }
  }

  return NextResponse.json({ date, duration: `${duration} min`, slots, total: slots.length });
}

export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { slot, clientName, clientEmail, motif, dossierId } = await req.json();

  if (!slot || !clientName) {
    return NextResponse.json({ error: 'slot et clientName requis' }, { status: 400 });
  }

  const appointment = {
    id: `rdv-${Date.now()}`,
    slot,
    clientName,
    clientEmail,
    motif: motif || 'Consultation',
    dossierId,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, appointment, message: `RDV confirme le ${new Date(slot).toLocaleDateString('fr-FR')} a ${new Date(slot).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` });
}


