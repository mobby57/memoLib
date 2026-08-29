#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'maturity-config.json'), 'utf8'));
const reports = path.join(root, 'reports');
fs.mkdirSync(reports, { recursive: true });
const historyFile = path.join(reports, 'maturity-history.json');

function exists(p) { return fs.existsSync(path.join(root, p)); }
function commandOk(command) {
  try { execSync(command, { cwd: root, stdio: 'ignore', env: process.env }); return true; }
  catch { return false; }
}
function firstPassing(commands) {
  for (const command of commands) if (commandOk(command)) return true;
  return false;
}
function scriptExists(name) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    return Boolean(pkg.scripts && pkg.scripts[name]);
  } catch { return false; }
}

const domains = {};
const blockers = [];

// Evidence-based checks. Missing dedicated checks are reported as partial/unknown,
// not silently treated as proof of correctness.
domains.tests = scriptExists('test:ci') && commandOk('npm run test:ci') ? 100 : 0;
domains.production = scriptExists('build') && commandOk('npm run build') ? 100 : 0;
domains.security = firstPassing(['npm run test:security', 'npm run security:audit']) ? 100 :
  (exists('.github/workflows/codeql.yml') || exists('.github/workflows/trivy.yml') || exists('.github/workflows/sast-semgrep.yml') ? 60 : 0);
domains.legal = firstPassing(['npm run test:legal', 'npm run test:deadlines', 'npm run test:legal-deadlines']) ? 100 : 0;
domains.email = firstPassing(['npm run email:test', 'npm run email:test:demo']) ? 100 : 0;
domains.documents = exists('prisma/schema.prisma') ? 70 : 0;
domains.ai = exists('src') && (exists('src/lib/ai') || exists('src/app/api')) ? 60 : 0;
domains.functional = exists('src') && exists('prisma/schema.prisma') ? 80 : 0;

if (domains.production < 100) blockers.push('production-build');
if (domains.tests < 100) blockers.push('critical-e2e');
if (domains.legal < 100) blockers.push('legal-deadlines');

const score = Object.entries(config.weights).reduce((sum, [key, weight]) => sum + (domains[key] || 0) * weight, 0) / 1000;
const level = Math.round(score * 10) / 10;

function stage(n) {
  if (n >= 9) return 'SaaS mature';
  if (n >= 8) return 'Production';
  if (n >= 7) return 'MVP commercial / pilote';
  if (n >= 6) return 'MVP technique';
  if (n >= 5) return 'Pré-MVP avancé';
  if (n >= 3) return 'Prototype fonctionnel';
  return 'Prototype';
}

let history = [];
if (fs.existsSync(historyFile)) {
  try { history = JSON.parse(fs.readFileSync(historyFile, 'utf8')); } catch { history = []; }
}
history.push({ date: new Date().toISOString(), score: level });
history = history.slice(-30);
fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

function eta(target) {
  if (level >= target) return 'ATTEINT';
  if (history.length < 3) return 'historique insuffisant';
  const a = history[0], b = history[history.length - 1];
  const days = Math.max(1, (new Date(b.date) - new Date(a.date)) / 86400000);
  const velocity = (b.score - a.score) / days;
  if (velocity <= 0) return 'indéterminée';
  return `~${((target - level) / velocity).toFixed(1)} jours`;
}

const pilot = level >= config.thresholds.pilot && blockers.length === 0;
const production = level >= config.thresholds.production && blockers.length === 0;
const verdict = production ? 'GO PRODUCTION' : pilot ? 'GO PILOTE' : 'NO-GO';
const report = { generatedAt: new Date().toISOString(), level, stage: stage(level), domains, blockers, eta: { mvp: eta(config.thresholds.mvp), pilot: eta(config.thresholds.pilot), production: eta(config.thresholds.production), mature: eta(config.thresholds.mature) }, verdict };
fs.writeFileSync(path.join(reports, 'maturity.json'), JSON.stringify(report, null, 2));

const md = `# MemoLib — Maturity Report\n\n**${level}/10 — ${stage(level)}**\n\n## Domaines\n\n| Domaine | Score |\n|---|---:|\n${Object.entries(domains).map(([k,v]) => `| ${k} | ${v}% |`).join('\n')}\n\n## Blockers\n\n${blockers.length ? blockers.map(b => `- 🔴 ${b}`).join('\n') : '- 🟢 Aucun blocker détecté'}\n\n## ETA\n\n- MVP: ${eta(config.thresholds.mvp)}\n- Pilote: ${eta(config.thresholds.pilot)}\n- Production: ${eta(config.thresholds.production)}\n- Mature: ${eta(config.thresholds.mature)}\n\n## Verdict\n\n**${verdict}**\n`;
fs.writeFileSync(path.join(reports, 'maturity.md'), md);
console.log(md);
if (process.env.CI === 'true' && blockers.length) process.exit(1);
