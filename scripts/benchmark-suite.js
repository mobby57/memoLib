#!/usr/bin/env node
/**
 * Benchmark suite runner for memoLib.
 *
 * Usage:
 *   npm run benchmark:run
 *   npm run benchmark:quick
 *
 * Optional env vars:
 *   BENCH_INCLUDE_DASHBOARD=1|0   (default: 1)
 *   BENCH_INCLUDE_HTTP=1|0        (default: 0)
 */

const { spawn } = require('child_process');
const { copyFile, mkdir, writeFile } = require('fs/promises');
const { join } = require('path');

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  return value === '1' || String(value).toLowerCase() === 'true';
}

function runCommand(name, command, args) {
  return new Promise((resolve) => {
    const started = Date.now();
    const startedAt = new Date(started).toISOString();

    console.log(`\n[bench] ${name}`);
    console.log(`[bench] > ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    });

    child.on('close', (exitCode) => {
      const ended = Date.now();
      const result = {
        name,
        command,
        args,
        startedAt,
        endedAt: new Date(ended).toISOString(),
        durationMs: ended - started,
        success: exitCode === 0,
        exitCode,
      };

      const status = result.success ? 'PASS' : 'FAIL';
      console.log(`[bench] ${name}: ${status} (${result.durationMs}ms)`);
      resolve(result);
    });

    child.on('error', () => {
      const ended = Date.now();
      const result = {
        name,
        command,
        args,
        startedAt,
        endedAt: new Date(ended).toISOString(),
        durationMs: ended - started,
        success: false,
        exitCode: -1,
      };

      console.log(`[bench] ${name}: FAIL (${result.durationMs}ms)`);
      resolve(result);
    });
  });
}

async function main() {
  const includeDashboard = toBool(process.env.BENCH_INCLUDE_DASHBOARD, true);
  const includeHttp = toBool(process.env.BENCH_INCLUDE_HTTP, false);

  const stepsToRun = [
    { name: 'Database health check', command: 'npm', args: ['run', 'db:health'] },
    { name: 'Database benchmark', command: 'npm', args: ['run', 'db:benchmark'] },
  ];

  if (includeDashboard) {
    stepsToRun.push({
      name: 'Database performance dashboard',
      command: 'tsx',
      args: ['scripts/database-performance-dashboard.ts'],
    });
  }

  if (includeHttp) {
    stepsToRun.push({
      name: 'HTTP endpoint benchmark prep',
      command: 'tsx',
      args: ['scripts/test-http-endpoints.ts'],
    });
  }

  const allStarted = Date.now();
  const results = [];

  for (const step of stepsToRun) {
    const result = await runCommand(step.name, step.command, step.args);
    results.push(result);
  }

  const allEnded = Date.now();
  const report = {
    generatedAt: new Date().toISOString(),
    host: process.env.COMPUTERNAME || process.env.HOSTNAME || 'unknown',
    nodeVersion: process.version,
    cwd: process.cwd(),
    steps: results,
    totals: {
      totalSteps: results.length,
      passed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      totalDurationMs: allEnded - allStarted,
    },
  };

  const reportsDir = join(process.cwd(), 'reports', 'benchmark');
  await mkdir(reportsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[.:]/g, '-');
  const reportPath = join(reportsDir, `benchmark-${stamp}.json`);
  const latestPath = join(reportsDir, 'latest.json');

  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  await copyFile(reportPath, latestPath);

  console.log('\n[bench] Summary');
  console.log(`[bench] steps: ${report.totals.totalSteps}`);
  console.log(`[bench] passed: ${report.totals.passed}`);
  console.log(`[bench] failed: ${report.totals.failed}`);
  console.log(`[bench] duration: ${report.totals.totalDurationMs}ms`);
  console.log(`[bench] report: ${reportPath}`);

  if (report.totals.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[bench] fatal error', error);
  process.exit(1);
});
