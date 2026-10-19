import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptEmailBody } from '@/lib/security/email-body';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 10;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get('apply') !== '1';

  try {
    const total = await prisma.email.count({
      where: { bodyEncrypted: null, NOT: { body: '' } },
    });

    if (dryRun) {
      return NextResponse.json({ mode: 'dry-run', toEncrypt: total });
    }

    let processed = 0;
    let errors = 0;

    while (true) {
      const batch = await prisma.email.findMany({
        where: { bodyEncrypted: null, NOT: { body: '' } },
        select: { id: true, body: true, htmlBody: true },
        take: BATCH_SIZE,
      });
      if (batch.length === 0) break;

      for (const email of batch) {
        try {
          const bodyEncrypted = encryptEmailBody(email.body);
          if (!bodyEncrypted) { errors++; continue; }
          const htmlBodyEncrypted = email.htmlBody
            ? encryptEmailBody(email.htmlBody)
            : null;
          await prisma.email.update({
            where: { id: email.id },
            data: { bodyEncrypted, htmlBodyEncrypted },
          });
          processed++;
        } catch (err) {
          errors++;
          logger.error('[backfill] error', {
            id: email.id,
            err: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    return NextResponse.json({
      mode: 'apply',
      total,
      processed,
      errors,
      remaining: await prisma.email.count({
        where: { bodyEncrypted: null, NOT: { body: '' } },
      }),
    });
  } catch (err) {
    logger.error('[backfill] fatal', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur' },
      { status: 500 }
    );
  }
}
