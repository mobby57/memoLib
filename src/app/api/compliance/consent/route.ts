import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/clerk-auth';
import {
  CONSENT_TYPES,
  CURRENT_PRIVACY_POLICY_VERSION,
  GDPRCompliance,
} from '@/lib/compliance/gdpr';
import { logger } from '@/lib/logger';

const consentRequestSchema = z
  .object({
    consents: z
      .array(
        z
          .object({
            type: z.enum(CONSENT_TYPES),
            granted: z.boolean(),
            policyVersion: z.literal(CURRENT_PRIVACY_POLICY_VERSION),
          })
          .strict()
      )
      .min(1)
      .max(CONSENT_TYPES.length),
  })
  .strict();

export async function POST(request: NextRequest) {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const parsed = consentRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données de consentement invalides' }, { status: 400 });
  }
  if (parsed.data.consents.some(({ type, granted }) => type === 'essential' && !granted)) {
    return NextResponse.json(
      { error: 'Le consentement essentiel ne peut pas être retiré depuis cette interface.' },
      { status: 400 }
    );
  }

  try {
    await GDPRCompliance.recordConsents(
      user.id,
      parsed.data.consents.map(({ type, granted, policyVersion }) => ({
        type,
        granted,
        version: policyVersion,
      }))
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Consent update failed', error, { userId: user.id });
    return NextResponse.json({ error: 'Impossible d’enregistrer le consentement' }, { status: 500 });
  }
}

export async function GET() {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    return NextResponse.json({ consents: await GDPRCompliance.getUserConsents(user.id) });
  } catch (error) {
    logger.error('Consent lookup failed', error, { userId: user.id });
    return NextResponse.json({ error: 'Impossible de récupérer les consentements' }, { status: 500 });
  }
}
