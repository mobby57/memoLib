#!/usr/bin/env tsx

/**
 * Lightweight concurrent load test for /api/emails/incoming.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 INCOMING_EMAIL_WEBHOOK_SECRET=secret tsx scripts/test-email-ingestion-load.ts
 */

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const webhookSecret = process.env.INCOMING_EMAIL_WEBHOOK_SECRET || 'test-secret';
const totalRequests = Number(process.env.LOAD_TOTAL || '50');
const concurrency = Number(process.env.LOAD_CONCURRENCY || '10');

interface JobResult {
  status: number;
  durationMs: number;
  ok: boolean;
  duplicate: boolean;
}

function buildPayload(index: number) {
  const group = Math.floor(index / 5);
  const duplicated = index % 5 === 0;
  const messageId = duplicated
    ? `<load-dup-${group}@example.com>`
    : `<load-unique-${index}-${Date.now()}@example.com>`;

  return {
    from: `client${index}@example.com`,
    to: process.env.LOAD_TO || 'cabinet@memolib.space',
    subject: index % 3 === 0 ? 'URGENT - Demande test charge' : 'Demande test charge',
    body: `Message de test charge #${index}`,
    messageId,
    attachments:
      index % 4 === 0
        ? [
            { filename: `piece-${index}.pdf`, mimeType: 'application/pdf', size: 1200 + index },
            { filename: `piece-${index}.jpg`, mimeType: 'image/jpeg', size: 900 + index },
          ]
        : [],
  };
}

async function runOne(index: number): Promise<JobResult> {
  const payload = buildPayload(index);
  const started = Date.now();

  const response = await fetch(`${baseUrl}/api/emails/incoming`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret,
    },
    body: JSON.stringify(payload),
  });

  let duplicate = false;
  try {
    const body = await response.json();
    duplicate = Boolean(body?.duplicate);
  } catch {
    duplicate = false;
  }

  return {
    status: response.status,
    durationMs: Date.now() - started,
    ok: response.ok,
    duplicate,
  };
}

async function main() {
  console.log('--- Email ingestion load test ---');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Total: ${totalRequests} | Concurrency: ${concurrency}`);

  const queue = Array.from({ length: totalRequests }, (_, i) => i + 1);
  const results: JobResult[] = [];

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const index = queue.shift();
      if (!index) {
        continue;
      }

      try {
        const result = await runOne(index);
        results.push(result);
      } catch {
        results.push({ status: 0, durationMs: 0, ok: false, duplicate: false });
      }
    }
  });

  const testStarted = Date.now();
  await Promise.all(workers);
  const totalDuration = Date.now() - testStarted;

  const okCount = results.filter((r) => r.ok).length;
  const duplicateCount = results.filter((r) => r.duplicate).length;
  const failures = results.filter((r) => !r.ok);

  const durations = results.map((r) => r.durationMs).filter((d) => d > 0).sort((a, b) => a - b);
  const percentile = (p: number) => {
    if (durations.length === 0) return 0;
    const idx = Math.min(durations.length - 1, Math.ceil((p / 100) * durations.length) - 1);
    return durations[idx] || 0;
  };

  const byStatus = results.reduce<Record<string, number>>((acc, result) => {
    const key = String(result.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log('');
  console.log('Summary:');
  console.log(`  Success: ${okCount}/${totalRequests}`);
  console.log(`  Duplicates detected: ${duplicateCount}`);
  console.log(`  Failures: ${failures.length}`);
  console.log(`  Throughput: ${(totalRequests / (totalDuration / 1000)).toFixed(2)} req/s`);
  console.log(`  p50: ${percentile(50)} ms | p95: ${percentile(95)} ms | p99: ${percentile(99)} ms`);
  console.log(`  Status breakdown: ${JSON.stringify(byStatus)}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Load test failed:', error);
  process.exitCode = 1;
});
