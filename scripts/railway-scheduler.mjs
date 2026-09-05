#!/usr/bin/env node
/**
 * Railway Cron Scheduler
 * =======================
 * Les crons de ce projet sont déclarés dans `vercel.json` (`crons`), mais Vercel
 * Cron ne s'exécute QUE sur Vercel. L'app tournant sur Railway, ces crons ne se
 * déclenchaient jamais — d'où : emails Gmail non monitorés/extraits, alertes de
 * délais non envoyées, etc.
 *
 * Ce script rejoue ces plannings depuis Railway : il lit `vercel.json` comme
 * source de vérité unique et appelle chaque endpoint `/api/cron/*` avec
 * `Authorization: Bearer $CRON_SECRET` (accepté par toutes les routes cron).
 *
 * Déploiement recommandé : un SECOND service Railway (même repo/Docker image),
 * avec Start Command = `node scripts/railway-scheduler.mjs`.
 *
 * Variables d'environnement requises :
 *   - APP_URL      : URL publique de l'app (ex. https://memolib.space)
 *                    (fallback: NEXT_PUBLIC_APP_URL)
 *   - CRON_SECRET  : le même secret que celui vérifié par les routes /api/cron/*
 *
 * Test manuel immédiat (déclenche tous les crons une fois puis quitte) :
 *   node scripts/railway-scheduler.mjs --run-now
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cron from 'node-cron';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const APP_URL = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
const CRON_SECRET = process.env.CRON_SECRET;
const RUN_NOW = process.argv.includes('--run-now');

function log(...args) {
  console.log(`[scheduler ${new Date().toISOString()}]`, ...args);
}

if (!APP_URL) {
  console.error('[scheduler] APP_URL (ou NEXT_PUBLIC_APP_URL) manquant. Abandon.');
  process.exit(1);
}
if (!CRON_SECRET) {
  console.error('[scheduler] CRON_SECRET manquant. Abandon.');
  process.exit(1);
}

/** Lit la liste des crons depuis vercel.json (source de vérité unique). */
function loadCrons() {
  const raw = readFileSync(join(ROOT, 'vercel.json'), 'utf-8');
  const parsed = JSON.parse(raw);
  const crons = Array.isArray(parsed.crons) ? parsed.crons : [];
  return crons.filter(c => c && c.path && c.schedule);
}

/** Appelle un endpoint cron avec le secret. */
async function trigger(path) {
  const url = `${APP_URL}${path}`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(120_000), // 2 min max par job
    });
    const ms = Date.now() - started;
    if (res.ok) {
      log(`OK   ${path} (${res.status}) ${ms}ms`);
    } else {
      const text = await res.text().catch(() => '');
      log(`FAIL ${path} (${res.status}) ${ms}ms ${text.slice(0, 200)}`);
    }
  } catch (err) {
    const ms = Date.now() - started;
    log(`ERR  ${path} ${ms}ms ${err instanceof Error ? err.message : String(err)}`);
  }
}

const crons = loadCrons();
if (crons.length === 0) {
  console.error('[scheduler] Aucun cron trouvé dans vercel.json. Abandon.');
  process.exit(1);
}

if (RUN_NOW) {
  log(`Déclenchement manuel de ${crons.length} cron(s) sur ${APP_URL}`);
  await Promise.all(crons.map(c => trigger(c.path)));
  log('Terminé (--run-now).');
  process.exit(0);
}

log(`Démarrage : ${crons.length} cron(s) planifié(s) vers ${APP_URL}`);
for (const c of crons) {
  if (!cron.validate(c.schedule)) {
    log(`SKIP planning invalide "${c.schedule}" pour ${c.path}`);
    continue;
  }
  cron.schedule(c.schedule, () => trigger(c.path), { timezone: 'Europe/Paris' });
  log(`planifié ${c.schedule}  ${c.path}`);
}

// Garde le process vivant.
process.on('SIGTERM', () => { log('SIGTERM reçu, arrêt.'); process.exit(0); });
process.on('SIGINT', () => { log('SIGINT reçu, arrêt.'); process.exit(0); });
