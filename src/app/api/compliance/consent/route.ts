import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth as clerkAuth } from '@clerk/nextjs/server';
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
  // Lit la session SANS exiger qu'elle existe (RGPD anonyme autorisé)
  const { userId } = await clerkAuth();

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
    if (userId) {
      // Utilisateur connecté → stockage BDD
      await GDPRCompliance.recordConsents(
        userId,
        parsed.data.consents.map(({ type, granted, policyVersion }) => ({
          type,
          granted,
          version: policyVersion,
        }))
      );
    } else {
      // Anonyme → log serveur (RGPD : preuve via cookie côté client)
      logger.info('Anonymous consent recorded', {
        types: parsed.data.consents.map((c) => c.type),
      });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set('consent-recorded', '1', {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    return res;
  } catch (error) {
    logger.error('Consent update failed', error, { userId });
    return NextResponse.json({ error: 'Impossible d’enregistrer le consentement' }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await clerkAuth();
  if (!userId) {
    return NextResponse.json({ consents: [] });
  }
  try {
    return NextResponse.json({ consents: await GDPRCompliance.getUserConsents(userId) });
  } catch (error) {
    logger.error('Consent lookup failed', error, { userId });
    return NextResponse.json({ error: 'Impossible de récupérer les consentements' }, { status: 500 });
  }
}
