import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { emailMonitor } from '@/lib/email/email-monitor-service';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
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
    console.error('Erreur test email:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
