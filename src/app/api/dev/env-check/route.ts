import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/dev/env-check
 *
 * Diagnostic de configuration d'environnement en production.
 * NE RÉVÈLE JAMAIS les valeurs des secrets — uniquement présent/absent/valide.
 * Protégé par CRON_SECRET (même mécanisme que les routes /api/cron/*).
 *
 * Usage:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://memolib.space/api/dev/env-check
 */
export const dynamic = 'force-dynamic';

function present(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

function minLen(name: string, n: number): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length >= n;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nodeEnv = process.env.NODE_ENV || '(non défini)';
  const isProd = nodeEnv === 'production';

  // Statut par variable — SANS jamais exposer la valeur.
  const report = {
    NODE_ENV: nodeEnv,
    isProduction: isProd,
    demoMode: process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1',
    checks: {
      // Chiffrement at-rest (bloque le boot en prod si absent/court)
      ENCRYPTION_MASTER_KEY: {
        present: present('ENCRYPTION_MASTER_KEY'),
        validLength: minLen('ENCRYPTION_MASTER_KEY', 32),
      },
      // Auth
      CLERK_SECRET_KEY: { present: present('CLERK_SECRET_KEY'), validLength: minLen('CLERK_SECRET_KEY', 32) },
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: { present: present('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') },
      // DB
      DATABASE_URL: {
        present: present('DATABASE_URL'),
        usesDefaultCreds: (process.env.DATABASE_URL || '').includes('password@localhost'),
      },
      // App URL (HTTPS requis en prod)
      NEXT_PUBLIC_APP_URL: {
        present: present('NEXT_PUBLIC_APP_URL'),
        isHttps: (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://'),
      },
      // Cron / scheduler
      CRON_SECRET: { present: present('CRON_SECRET') },
      // Email Gmail (OAuth + monitoring)
      GOOGLE_CLIENT_ID: { present: present('GOOGLE_CLIENT_ID') },
      GOOGLE_CLIENT_SECRET: { present: present('GOOGLE_CLIENT_SECRET') },
      // Stripe
      STRIPE_SECRET_KEY: { present: present('STRIPE_SECRET_KEY') },
      STRIPE_WEBHOOK_SECRET: { present: present('STRIPE_WEBHOOK_SECRET') },
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(report, { status: 200 });
}
