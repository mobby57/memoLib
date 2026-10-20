import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const SANDBOX_PLAN_ID = 'sandbox-plan-demo-0000-0000-000000000001';
const SANDBOX_TENANT_ID = 'sandbox-tenant-demo-0000-0000-000000000001';
const SANDBOX_USER_ID = 'sandbox-user-demo-0000-0000-000000000001';
const SANDBOX_CLIENT_ID = 'sandbox-client-demo-0000-0000-000000000001';
const SANDBOX_DOSSIER_ID = 'sandbox-dossier-demo-0000-0000-000000000001';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  try {
    await prisma.plan.upsert({
      where: { id: SANDBOX_PLAN_ID },
      update: {},
      create: {
        id: SANDBOX_PLAN_ID,
        name: 'sandbox-plan',
        displayName: 'Plan Demo (FICTIF)',
        priceMonthly: 0,
        priceYearly: 0,
      },
    });

    await prisma.tenant.upsert({
      where: { id: SANDBOX_TENANT_ID },
      update: {},
      create: {
        id: SANDBOX_TENANT_ID,
        name: 'Cabinet Demo (FICTIF)',
        subdomain: 'sandbox-demo',
        planId: SANDBOX_PLAN_ID,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    await prisma.user.upsert({
      where: { id: SANDBOX_USER_ID },
      update: {},
      create: {
        id: SANDBOX_USER_ID,
        email: 'demo-sandbox@example-fictif.fr',
        name: 'Maitre Demo (FICTIF)',
        password: '',
        role: 'AVOCAT',
        tenantId: SANDBOX_TENANT_ID,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    await prisma.client.upsert({
      where: { id: SANDBOX_CLIENT_ID },
      update: {},
      create: {
        id: SANDBOX_CLIENT_ID,
        tenantId: SANDBOX_TENANT_ID,
        firstName: 'Jean',
        lastName: 'DUPONT (FICTIF)',
        email: 'jean.dupont@example-fictif.fr',
        phone: '0102030405',
        updatedAt: new Date(),
      },
    });

    await prisma.dossier.upsert({
      where: { id: SANDBOX_DOSSIER_ID },
      update: {},
      create: {
        id: SANDBOX_DOSSIER_ID,
        tenantId: SANDBOX_TENANT_ID,
        numero: 'DEMO-2026-001',
        clientId: SANDBOX_CLIENT_ID,
        typeDossier: 'OQTF',
        objet: 'OQTF - M. DUPONT (dossier fictif)',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      tenantId: SANDBOX_TENANT_ID,
      userEmail: 'demo-sandbox@example-fictif.fr',
      dossierNumero: 'DEMO-2026-001',
    });
  } catch (err) {
    logger.error('[sandbox-seed] fatal', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur' },
      { status: 500 }
    );
  }
}
