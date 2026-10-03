#!/usr/bin/env node
/**
 * rotate-secrets-guide.mjs
 *
 * Generates fresh cryptographic secrets and prints a checklist of the
 * externally-managed credentials that MUST be rotated before go-to-market,
 * because they were found in cleartext in a local .env file.
 *
 * This script does NOT read, modify, or print any existing secret values.
 * It only generates NEW candidate values and tells you where to put them.
 *
 * Usage:
 *   node scripts/rotate-secrets-guide.mjs
 */

import { randomBytes } from 'node:crypto';

const hex = (bytes) => randomBytes(bytes).toString('hex');
const b64 = (bytes) => randomBytes(bytes).toString('base64');

const line = (s = '') => process.stdout.write(s + '\n');

line('='.repeat(70));
line(' MemoLib — Secret rotation helper (GTM blocker #1)');
line('='.repeat(70));
line('');
line('Freshly generated secrets (copy into your deployment secret store,');
line('NOT into a committed file):');
line('');
line(`  NEXTAUTH_SECRET=${b64(32)}`);
line(`  ENCRYPTION_MASTER_KEY=${hex(32)}   # 64 hex chars = 32 bytes (AES-256)`);
line(`  CRON_SECRET=${hex(24)}`);
line(`  EMAIL_WEBHOOK_SECRET=${hex(24)}`);
line('');
line('-'.repeat(70));
line(' MUST be rotated at the provider (cannot be regenerated locally):');
line('-'.repeat(70));
line('');
line('  [ ] Stripe secret key (sk_live_...)');
line('      -> https://dashboard.stripe.com/apikeys → Roll key');
line('      -> A live key was found in cleartext in .env.local. Treat as compromised.');
line('');
line('  [ ] Stripe webhook signing secret (whsec_...)');
line('      -> https://dashboard.stripe.com/webhooks → reveal/roll');
line('');
line('  [ ] Google OAuth client secret (GOCSPX-...)');
line('      -> https://console.cloud.google.com/apis/credentials → reset secret');
line('');
line('  [ ] Gmail IMAP app password');
line('      -> https://myaccount.google.com/apppasswords → revoke + recreate');
line('');
line('  [ ] Clerk keys — currently pk_test_/sk_test_ (TEST keys!)');
line('      -> https://dashboard.clerk.com → create a PRODUCTION instance');
line('      -> swap NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY to pk_live_/sk_live_');
line('');
line('-'.repeat(70));
line(' After rotating:');
line('-'.repeat(70));
line('  1. Store every value in the deployment secret manager (Railway/Vercel vars).');
line('  2. Remove secret values from any local .env.local before sharing the machine.');
line('  3. Confirm .env* is gitignored (it is) and never commit real values.');
line('  4. Redeploy so the app picks up the rotated secrets.');
line('');
