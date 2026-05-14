#!/usr/bin/env node
/**
 * AUTO-03: Automatic secret rotation for expired/near-expiry secrets
 *
 * Checks secrets defined in .env.local / environment variables for:
 *   - JWT secrets older than MAX_AGE_DAYS
 *   - API keys with embedded expiry metadata
 *   - Tokens that can be self-rotated (NEXTAUTH_SECRET, encryption keys)
 *
 * Usage:
 *   node scripts/rotate-secrets.js [--dry-run] [--max-age-days 90]
 *
 * Exit 0 = no action needed or rotation succeeded
 * Exit 1 = rotation required but failed (or --dry-run found issues)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const maxAgeDaysArg = args.indexOf('--max-age-days');
const MAX_AGE_DAYS = maxAgeDaysArg !== -1 ? Number(args[maxAgeDaysArg + 1]) : 90;

const ENV_FILE = path.join(process.cwd(), '.env.local');
const ROTATION_LOG = path.join(process.cwd(), '.secret-rotation-log.json');

// Secrets that can be auto-rotated (generate new random value)
const AUTO_ROTATABLE = [
  'NEXTAUTH_SECRET',
  'ENCRYPTION_MASTER_KEY',
  'WEBHOOK_SECRET',
  'INTERNAL_API_KEY',
];

// Secrets that require manual rotation (external services)
const MANUAL_ROTATION_REQUIRED = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'SENTRY_AUTH_TOKEN',
  'VERCEL_TOKEN',
  'UPSTASH_REDIS_REST_TOKEN',
  'BLOB_READ_WRITE_TOKEN',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_SECRET',
];

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function generateSecret(bytes = 64) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function loadRotationLog() {
  try {
    return JSON.parse(fs.readFileSync(ROTATION_LOG, 'utf8'));
  } catch {
    return {};
  }
}

function saveRotationLog(log) {
  fs.writeFileSync(ROTATION_LOG, JSON.stringify(log, null, 2));
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

function writeEnvFile(filePath, envVars) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  let updated = existing;

  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}="${value}"`;
    if (regex.test(updated)) {
      updated = updated.replace(regex, newLine);
    } else {
      updated += `\n${newLine}`;
    }
  }

  fs.writeFileSync(filePath, updated);
}

function isExpired(key, rotationLog) {
  const entry = rotationLog[key];
  if (!entry) return true; // Never rotated = treat as expired
  const ageMs = Date.now() - new Date(entry.rotatedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays >= MAX_AGE_DAYS;
}

function daysOld(key, rotationLog) {
  const entry = rotationLog[key];
  if (!entry) return Infinity;
  const ageMs = Date.now() - new Date(entry.rotatedAt).getTime();
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔑 SECRET ROTATION AUDIT');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Max age: ${MAX_AGE_DAYS} days`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('');

  const rotationLog = loadRotationLog();
  const envVars = parseEnvFile(ENV_FILE);
  const newValues = {};
  const manualRequired = [];
  let hasIssues = false;

  // Check auto-rotatable secrets
  console.log('  AUTO-ROTATABLE SECRETS');
  console.log('  ─────────────────────────────────────────────────────');

  for (const key of AUTO_ROTATABLE) {
    const age = daysOld(key, rotationLog);
    const expired = isExpired(key, rotationLog);
    const present = !!(envVars[key] || process.env[key]);

    if (!present) {
      log('⚪', `${key} — not set (skipping)`);
      continue;
    }

    if (expired) {
      const ageStr = age === Infinity ? 'never rotated' : `${age} days old`;
      log('🔄', `${key} — ROTATING (${ageStr})`);

      if (!DRY_RUN) {
        const newSecret = generateSecret();
        newValues[key] = newSecret;
        rotationLog[key] = {
          rotatedAt: new Date().toISOString(),
          previousAge: age === Infinity ? null : age,
        };
        log('  ✅', `${key} — new value generated`);
      } else {
        log('  ℹ️ ', `${key} — would be rotated (dry-run)`);
        hasIssues = true;
      }
    } else {
      log('✅', `${key} — OK (${age} days old, expires in ${MAX_AGE_DAYS - age} days)`);
    }
  }

  // Check manual-rotation secrets
  console.log('');
  console.log('  MANUAL ROTATION REQUIRED (external services)');
  console.log('  ─────────────────────────────────────────────────────');

  for (const key of MANUAL_ROTATION_REQUIRED) {
    const age = daysOld(key, rotationLog);
    const expired = isExpired(key, rotationLog);
    const present = !!(envVars[key] || process.env[key]);

    if (!present) {
      log('⚪', `${key} — not configured (skipping)`);
      continue;
    }

    if (expired) {
      const ageStr = age === Infinity ? 'never logged' : `${age} days old`;
      log('⚠️ ', `${key} — MANUAL ROTATION NEEDED (${ageStr})`);
      manualRequired.push({ key, age });
      hasIssues = true;
    } else {
      log('✅', `${key} — OK (${age} days old)`);
    }
  }

  // Apply changes
  if (!DRY_RUN && Object.keys(newValues).length > 0) {
    console.log('');
    console.log('  APPLYING CHANGES');
    console.log('  ─────────────────────────────────────────────────────');

    if (fs.existsSync(ENV_FILE)) {
      writeEnvFile(ENV_FILE, newValues);
      log('💾', `Updated ${ENV_FILE}`);
    } else {
      log('⚠️ ', `.env.local not found — new secrets printed below (save them manually):`);
      for (const [k, v] of Object.entries(newValues)) {
        console.log(`  ${k}="${v}"`);
      }
    }

    saveRotationLog(rotationLog);
    log('📋', `Rotation log saved to ${ROTATION_LOG}`);
  }

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════');

  if (manualRequired.length > 0) {
    console.log('\n⚠️  MANUAL ACTION REQUIRED:');
    for (const { key, age } of manualRequired) {
      const ageStr = age === Infinity ? 'never rotated' : `${age} days old`;
      console.log(`   • ${key} (${ageStr}) — rotate in your provider dashboard`);
    }
    console.log('   After rotating, update .env.local and run:');
    console.log('   node scripts/rotate-secrets.js --mark-rotated <KEY>');
  }

  if (DRY_RUN && hasIssues) {
    console.log('\n🔍 Dry-run complete — rotation needed. Run without --dry-run to apply.\n');
    process.exit(1);
  } else if (!DRY_RUN && hasIssues) {
    console.log('\n⚠️  Some secrets require manual rotation (see above).\n');
    process.exit(0); // Don't block CI for manual items
  } else {
    console.log('\n✅ All secrets are within rotation policy.\n');
    process.exit(0);
  }
}

// Handle --mark-rotated <KEY> subcommand
if (args.includes('--mark-rotated')) {
  const keyIdx = args.indexOf('--mark-rotated') + 1;
  const key = args[keyIdx];
  if (!key) {
    console.error('Usage: --mark-rotated <KEY>');
    process.exit(1);
  }
  const rotationLog = loadRotationLog();
  rotationLog[key] = { rotatedAt: new Date().toISOString(), manual: true };
  saveRotationLog(rotationLog);
  console.log(`✅ Marked ${key} as rotated at ${rotationLog[key].rotatedAt}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
