import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { provisionFromClerk } from '@/lib/services/saas-provisioning';

/**
 * GET /api/dev/test-provisioning?secret=XXX
 *
 * Route de TEST (temporaire) : automatise la vérification du provisioning sur
 * l'environnement déployé, sans navigateur ni Clerk réel.
 * 1. simule un payload Clerk user.created
 * 2. appelle provisionFromClerk
 * 3. vérifie tenant + user + settings + subscription
 * 4. NETTOIE le compte de test (ne laisse aucune trace)
 *
 * Protégée par le secret CRON_SECRET (déjà présent en env). À retirer après usage.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const clerkId = 'user_test_prov_' + Date.now();
  const email = `test-prov-${Date.now()}@memolib-test.local`;
  const steps: Record<string, unknown> = {};

  try {
    // État des plans (pour diagnostic)
    const plans = await prisma.plan.findMany({ select: { name: true, priceMonthly: true } });
    steps.plans = plans.map((p) => p.name);

    // 1. Provisioning via faux payload Clerk
    await provisionFromClerk({
      id: clerkId,
      primary_email_address_id: 'eid-1',
      email_addresses: [{ id: 'eid-1', email_address: email }],
      first_name: 'Test',
      last_name: 'Provisioning',
      unsafe_metadata: { plan: 'SOLO', cabinet: 'Cabinet Test Auto' },
      public_metadata: {},
    } as any);

    // 2. Vérifications
    const user = await prisma.user.findUnique({ where: { clerkUserId: clerkId } });
    steps.userCreated = !!user;
    steps.userRole = user?.role;
    steps.hasTenant = !!user?.tenantId;

    let tenantOk = false;
    let settingsOk = false;
    let subOk = false;
    if (user?.tenantId) {
      tenantOk = !!(await prisma.tenant.findUnique({ where: { id: user.tenantId } }));
      settingsOk = !!(await prisma.tenantSettings.findFirst({ where: { tenantId: user.tenantId } }));
      subOk = !!(await prisma.subscription.findFirst({ where: { tenantId: user.tenantId } }));
    }
    steps.tenantCreated = tenantOk;
    steps.settingsCreated = settingsOk;
    steps.subscriptionCreated = subOk;

    const verdict = !!user && tenantOk && settingsOk && subOk;
    steps.verdict = verdict ? 'OK — provisioning fonctionne' : 'ECHEC';

    // 3. Nettoyage (ne laisse aucune trace du compte de test)
    if (user?.tenantId) {
      await prisma.subscription.deleteMany({ where: { tenantId: user.tenantId } });
      await prisma.tenantSettings.deleteMany({ where: { tenantId: user.tenantId } });
      await prisma.user.deleteMany({ where: { clerkUserId: clerkId } });
      await prisma.tenant.deleteMany({ where: { id: user.tenantId } });
      steps.cleanup = 'done';
    } else if (user) {
      await prisma.user.deleteMany({ where: { clerkUserId: clerkId } });
      steps.cleanup = 'user only';
    }

    return NextResponse.json({ ok: verdict, steps });
  } catch (e: any) {
    steps.error = e?.message || String(e);
    // Tentative de nettoyage même en cas d'erreur
    try {
      await prisma.user.deleteMany({ where: { clerkUserId: clerkId } });
    } catch {}
    return NextResponse.json({ ok: false, steps }, { status: 500 });
  }
}
