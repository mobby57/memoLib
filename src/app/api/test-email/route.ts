import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { emailMonitor } from '@/lib/email/email-monitor-service';

export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const tenantId = (user as any).tenantId;
  const role = String((user as any).role || '').toUpperCase();
  const allowedRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });
  }

  try {
    const { from, subject, body } = await req.json();

    if (!from || !subject || !body) {
      return NextResponse.json({
        error: 'Champs requis: from, subject, body'
      }, { status: 400 });
    }

    const rawEmail = `From: ${from}\nSubject: ${subject}\n\n${body}`;
    const result = await emailMonitor.processEmail(tenantId, rawEmail);

    return NextResponse.json({
      success: true,
      ...result,
      message: result.action === 'created'
        ? `✅ Nouveau dossier ${result.dossierId} créé`
        : result.action === 'linked'
        ? `✅ Email lié au dossier ${result.dossierId}`
        : '⚠️ Email enregistré, action manuelle requise'
    });

  } catch (error) {
    logger.error('Erreur test email:', { error });
    return NextResponse.json({
      error: 'Erreur serveur'
    }, { status: 500 });
  }
}




