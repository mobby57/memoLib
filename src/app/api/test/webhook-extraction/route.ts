import { extractWebhookFields } from '@/lib/webhook-field-extraction';
import { validateWebhookPayloadSafe } from '@/lib/webhook-schemas';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function ensureAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  const role = String((session.user as any).role || '').toUpperCase();
  const allowedRoles = new Set(['ADMIN', 'SUPER_ADMIN']);
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const authError = await ensureAdminAccess();
    if (authError) {
      return authError;
    }

    const payload = await req.json();

    // Step 1: Validate
    const validation = validateWebhookPayloadSafe(payload);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          step: 'validation',
          errors: validation.errors.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Step 2: Extract fields
    try {
      const normalized = extractWebhookFields(validation.data);
      return NextResponse.json({
        success: true,
        step: 'extraction',
        channel: normalized.channel,
        externalId: normalized.externalId,
        sender: normalized.sender,
        subject: normalized.subject,
        bodyLength: normalized.body.length,
        metadata: normalized.metadata,
      });
    } catch (extractError: any) {
      return NextResponse.json(
        {
          success: false,
          step: 'extraction',
          error: 'Erreur extraction',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        step: 'json_parsing',
        error: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
