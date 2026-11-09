#!/usr/bin/env node
/**
 * Pre-deploy checklist — run before any production deployment
 * Usage: node scripts/pre-deploy-check.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warnings = 0;

function fail(msg) { console.error(`  ❌ ${msg}`); errors++; }
function warn(msg) { console.warn(`  ⚠️  ${msg}`); warnings++; }
function pass(msg) { console.log(`  ✅ ${msg}`); }

console.log('\n🔍 MemoLib Pre-Deploy Check\n');

// 1. No secrets in tracked files
console.log('1. Secrets leak check');
const dangerousFiles = ['.env.local', '.env.production', 'prod-key.txt', '.env.security'];
for (const f of dangerousFiles) {
  if (fs.existsSync(path.join(ROOT, f))) {
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    if (!gitignore.includes(f)) {
      fail(`${f} exists but is NOT in .gitignore`);
    } else {
      pass(`${f} is in .gitignore`);
    }
  }
}

// 2. No hardcoded secrets in docker-compose
console.log('2. Docker compose secrets');
const compose = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf8');
if (compose.includes('MemoLib-Super-Secret') || compose.includes('secret-key-change-me')) {
  fail('docker-compose.yml contains hardcoded secrets');
} else {
  pass('No hardcoded secrets in docker-compose.yml');
}

// 3. Prisma schema exists
console.log('3. Database');
if (fs.existsSync(path.join(ROOT, 'prisma', 'schema.prisma'))) {
  pass('Prisma schema found');
} else {
  fail('prisma/schema.prisma missing');
}

// 4. Dockerfile exists
console.log('4. Docker');
if (fs.existsSync(path.join(ROOT, 'Dockerfile.secure'))) {
  const df = fs.readFileSync(path.join(ROOT, 'Dockerfile.secure'), 'utf8');
  if (df.includes('prisma migrate deploy')) {
    pass('Dockerfile.secure includes prisma migrate');
  } else {
    warn('Dockerfile.secure does not run prisma migrate deploy');
  }
  if (df.includes('USER nextjs') || df.includes('USER node')) {
    pass('Dockerfile runs as non-root user');
  } else {
    fail('Dockerfile runs as root');
  }
} else {
  fail('Dockerfile.secure missing');
}

// 5. Next.js standalone output
console.log('5. Next.js config');
const nextConfig = fs.readFileSync(path.join(ROOT, 'next.config.mjs'), 'utf8');
if (nextConfig.includes("output: 'standalone'") || nextConfig.includes('output: "standalone"')) {
  pass('Next.js standalone output enabled');
} else {
  fail("next.config.mjs missing output: 'standalone' (required for Docker)");
}

// 6. CI/CD pipeline
console.log('6. CI/CD');
const ciPath = path.join(ROOT, '.github', 'workflows', 'ci-cd.yml');
if (fs.existsSync(ciPath)) {
  const ci = fs.readFileSync(ciPath, 'utf8');
  if (ci.includes('prisma migrate deploy')) {
    pass('CI/CD runs prisma migrations');
  } else {
    warn('CI/CD does not run prisma migrate deploy');
  }
  if (ci.includes('flyctl deploy') || ci.includes('vercel') || ci.includes('aws')) {
    pass('CI/CD has real deployment step');
  } else {
    fail('CI/CD has no real deployment step (only echo)');
  }
} else {
  fail('.github/workflows/ci-cd.yml missing');
}

// 7. Security headers
console.log('7. Security');
if (fs.existsSync(path.join(ROOT, 'vercel.json'))) {
  const vercel = fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8');
  const requiredHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'Strict-Transport-Security'];
  for (const h of requiredHeaders) {
    if (vercel.includes(h)) {
      pass(`${h} header configured`);
    } else {
      warn(`${h} header missing in vercel.json`);
    }
  }
}

// Summary
console.log(`\n${'='.repeat(50)}`);
if (errors > 0) {
  console.error(`\n💥 ${errors} error(s), ${warnings} warning(s) — FIX BEFORE DEPLOYING\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠️  ${warnings} warning(s), 0 errors — Review warnings before deploying\n`);
} else {
  console.log(`\n🚀 All checks passed — Ready to deploy!\n`);
}
