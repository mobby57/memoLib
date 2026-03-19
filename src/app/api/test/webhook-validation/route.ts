import { validateWebhookPayloadSafe } from '@/lib/webhook-schemas';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

    const result = validateWebhookPayloadSafe(payload);

    if (!result.success) {
      return NextResponse.json(
        {
          valid: false,
          errors: result.errors.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        },
        { status: 400 }
      );
    }

    if (!result.data) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Payload validé mais données absentes',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      channel: result.data.channel,
      message: 'Validation réussie',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
