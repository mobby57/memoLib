import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Endpoint temporaire : cree les plans en base si absents.
 * Protege par CRON_SECRET. A supprimer apres usage.
 */

async function applySchemaFix() {
  const fixes = [
    // TenantSettings - colonnes cabinet config
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetName" TEXT`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetLogo" TEXT`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetAddress" TEXT`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetPhone" TEXT`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "cabinetEmail" TEXT`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "defaultLanguage" TEXT NOT NULL DEFAULT 'fr'`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "defaultTimezone" TEXT NOT NULL DEFAULT 'Europe/Paris'`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY'`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "deadlineNotifications" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "ocrEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "maxUploadSizeMb" INTEGER NOT NULL DEFAULT 10`,
    `ALTER TABLE "TenantSettings" ADD COLUMN IF NOT EXISTS "maxFilesPerUpload" INTEGER NOT NULL DEFAULT 5`,
  ];
  const results: string[] = [];
  for (const sql of fixes) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.split(' ').slice(0, 5).join(' ')}...`);
    } catch (e) {
      results.push(`ERR: ${sql} - ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }
  return results;
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET absent' }, { status: 503 });
  }
  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  // 1. Fix schema drift (colonnes manquantes)
  const schemaResults = await applySchemaFix();

  // 2. Creer les plans
  const plans = [
    { name: 'solo', displayName: 'Solo', priceMonthly: 29, priceYearly: 290, maxDossiers: 50, maxUsers: 1 },
    { name: 'cabinet', displayName: 'Cabinet', priceMonthly: 69, priceYearly: 690, maxDossiers: 500, maxUsers: 10 },
    { name: 'enterprise', displayName: 'Enterprise', priceMonthly: 199, priceYearly: 1990, maxDossiers: -1, maxUsers: 50 },
  ];

  const results: string[] = [];
  for (const p of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: p.name } });
    if (existing) {
      results.push(`exists: ${p.name}`);
      continue;
    }
    await prisma.plan.create({
      data: {
        id: crypto.randomUUID(),
        name: p.name,
        displayName: p.displayName,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        maxDossiers: p.maxDossiers,
        maxUsers: p.maxUsers,
        updatedAt: new Date(),
      },
    });
    results.push(`created: ${p.name}`);
  }

  logger.info('[SEED] Plans crees', { results });
  return NextResponse.json({ success: true, schema: schemaResults, results });
}
