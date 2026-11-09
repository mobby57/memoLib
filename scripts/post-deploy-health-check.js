#!/usr/bin/env node
/**
 * ENG-01: Post-deploy health-check with assertions
 * Usage: node scripts/post-deploy-health-check.js [BASE_URL]
 * Exit 0 = all checks passed, Exit 1 = failure
 */

const BASE_URL = process.argv[2] || process.env.DEPLOY_URL || 'http://localhost:3000';
const TIMEOUT_MS = 10_000;

let passed = 0;
let failed = 0;

function log(icon, label, detail = '') {
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function request(path, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      redirect: 'manual',
      ...opts,
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function assert(label, fn) {
  try {
    await fn();
    log('✅', label);
    passed++;
  } catch (err) {
    log('❌', label, err.message);
    failed++;
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

// ─── Checks ──────────────────────────────────────────────────────────────────

async function runChecks() {
  console.log(`\n🔍 Health-check: ${BASE_URL}\n`);

  // 1. App is reachable
  await assert('App reachable (GET /)', async () => {
    const res = await request('/');
    expect(res.status < 500, `HTTP ${res.status}`);
  });

  // 2. Health endpoint responds with 200
  await assert('Health endpoint (GET /api/health)', async () => {
    const res = await request('/api/health');
    expect(res.status === 200, `HTTP ${res.status}`);
    const body = await res.json().catch(() => null);
    expect(body !== null, 'Response is not JSON');
  });

  // 3. Auth endpoint exists (not 404)
  await assert('Auth endpoint reachable (POST /api/auth/register)', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    // 400 = validation error (expected), 404 = route missing (bad)
    expect(res.status !== 404, `Route not found (404)`);
    expect(res.status !== 500, `Server error (500)`);
  });

  // 4. Security headers present
  await assert('Security headers present', async () => {
    const res = await request('/');
    const csp = res.headers.get('content-security-policy');
    const xfo = res.headers.get('x-frame-options');
    const xcto = res.headers.get('x-content-type-options');
    expect(csp, 'Missing Content-Security-Policy');
    expect(xfo === 'DENY', `X-Frame-Options is "${xfo}", expected "DENY"`);
    expect(xcto === 'nosniff', `X-Content-Type-Options is "${xcto}", expected "nosniff"`);
  });

  // 5. No server version leak
  await assert('No server version leak', async () => {
    const res = await request('/');
    const server = res.headers.get('server');
    const poweredBy = res.headers.get('x-powered-by');
    expect(!server || server === '', `Server header leaks: "${server}"`);
    expect(!poweredBy || poweredBy === '', `X-Powered-By leaks: "${poweredBy}"`);
  });

  // 6. Rate-limit headers on auth routes
  await assert('Rate-limit headers on /api/auth/register', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'probe@test.com', password: 'probe' }),
    });
    const rl = res.headers.get('x-ratelimit-limit') || res.headers.get('x-ratelimit-remaining');
    // 429 also means rate limiting is active
    expect(rl || res.status === 429, 'No rate-limit headers detected');
  });

  // 7. Static assets served (Next.js _next/static)
  await assert('Static assets reachable', async () => {
    const res = await request('/_next/static/chunks/main.js').catch(() => null);
    // 404 is acceptable (chunk name varies), but not a connection error
    expect(res !== null, 'Could not reach static asset path');
  });

  // 8. Redirect HTTP → HTTPS in production
  if (BASE_URL.startsWith('https://')) {
    await assert('HSTS header present in production', async () => {
      const res = await request('/');
      const hsts = res.headers.get('strict-transport-security');
      expect(hsts && hsts.includes('max-age='), `Missing or invalid HSTS: "${hsts}"`);
    });
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error('\n🚨 Health-check FAILED — deployment may be unhealthy.\n');
    process.exit(1);
  } else {
    console.log('\n🎉 All health checks passed.\n');
    process.exit(0);
  }
}

runChecks().catch((err) => {
  console.error('Fatal error during health-check:', err.message);
  process.exit(1);
});
