#!/usr/bin/env node
/**
 * MemoLib — Validation métier (Business Logic axis)
 *
 * Principe: "un test existe" != "la logique métier est validée".
 * Un cas ne compte comme PASS que si:
 *   1) son statut déclaré dans business-cases.json est "PASS", ET
 *   2) le fichier de test attendu (expectedTest) existe RÉELLEMENT sur disque.
 * Sinon il est reclassé (GAP / FALSE / PARTIAL / BROKEN) et NE compte JAMAIS comme réussi.
 *
 * Sortie:
 *   - reports/business-validation.json  (machine)
 *   - reports/business-validation.md     (le rapport "cas métier réellement vérifiés")
 * Code de sortie 1 en CI si un axe bloquant échoue (--strict).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const catalogPath = path.join(__dirname, 'business-cases.json');
const reportsDir = path.join(root, 'reports');
const strict = process.argv.includes('--strict');

const { execSync } = require('child_process');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
fs.mkdirSync(reportsDir, { recursive: true });

const runCommands = process.argv.includes('--run-commands');

/**
 * Évalue un axe piloté par commande (build/tests/e2e).
 * Retourne 'PASS' | 'FAIL' | 'UNKNOWN'. UNKNOWN quand on ne lance pas les commandes
 * (ou que l'environnement n'a pas les dépendances) — JAMAIS un faux PASS.
 */
function evalCommandGate(gate) {
  if (!runCommands) return 'UNKNOWN';
  const pkgScripts = (() => {
    try { return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts || {}; }
    catch { return {}; }
  })();
  for (const cmd of gate.commands) {
    // si la commande est "npm run X", vérifier que le script existe
    const m = cmd.match(/^npm run (\S+)/);
    if (m && !pkgScripts[m[1]]) return 'UNKNOWN';
    try { execSync(cmd, { cwd: root, stdio: 'ignore', env: process.env }); }
    catch { return 'FAIL'; }
  }
  return 'PASS';
}

/** Un chemin de test "attendu" existe-t-il réellement ? Supporte les patterns "a + b" et les globs simples de dossier. */
function expectedTestExists(expectedTest) {
  if (!expectedTest || /^TODO/i.test(expectedTest)) return false;
  // plusieurs fichiers séparés par " + "
  const parts = expectedTest.split('+').map(s => s.trim()).filter(Boolean);
  return parts.some(part => {
    // retirer un éventuel suffixe glob (…/*.json, dossier/*)
    const cleaned = part.replace(/\/\*.*$/, '');
    const abs = path.join(root, cleaned);
    if (fs.existsSync(abs)) return true;
    // glob "dir/*.json" -> vérifier qu'au moins un fichier matche dans le dossier
    const globMatch = part.match(/^(.*)\/\*(\.[a-z]+)?$/i);
    if (globMatch) {
      const dir = path.join(root, globMatch[1]);
      const ext = globMatch[2] || '';
      try {
        return fs.readdirSync(dir).some(f => (ext ? f.endsWith(ext) : true));
      } catch { return false; }
    }
    return false;
  });
}

const PASSING = new Set(['PASS']);
// Reclassement, dans l'ordre:
//  - awaitingFix: un test existe mais échoue volontairement contre le code actuel (fix attendu) -> jamais PASS.
//  - un PASS déclaré sans fichier de test réel -> BROKEN (jamais compté comme réussi).
function effectiveStatus(c) {
  const declared = c.status;
  if (c.awaitingFix) return declared === 'PASS' ? 'BROKEN' : declared;
  if (declared === 'PASS' && !expectedTestExists(c.expectedTest)) return 'BROKEN';
  return declared;
}

const byAxis = new Map(catalog.axes.map(a => [a.id, { ...a, cases: [] }]));
for (const c of catalog.cases) {
  const eff = effectiveStatus(c);
  const entry = { ...c, effectiveStatus: eff, pass: PASSING.has(eff) };
  if (byAxis.has(c.axis)) byAxis.get(c.axis).cases.push(entry);
}

const commandGates = catalog.commandGates || {};
const axisResults = [];
for (const axis of byAxis.values()) {
  if (commandGates[axis.id]) {
    // Axe piloté par commande (build / tests / e2e)
    const gate = evalCommandGate(commandGates[axis.id]);
    axisResults.push({ id: axis.id, label: axis.label, blocker: axis.blocker, kind: 'command', total: null, passed: null, gate, cases: [], commandDesc: commandGates[axis.id].description });
    continue;
  }
  const total = axis.cases.length;
  const passed = axis.cases.filter(c => c.pass).length;
  // Un axe bloquant PASSE seulement si TOUS ses cas passent (aucun GAP/FALSE/PARTIAL/BROKEN).
  const gate = total > 0 && passed === total ? 'PASS' : 'FAIL';
  axisResults.push({ id: axis.id, label: axis.label, blocker: axis.blocker, kind: 'cases', total, passed, gate, cases: axis.cases });
}

// Un axe bloquant échoue s'il n'est pas explicitement PASS (FAIL ou UNKNOWN comptent comme non-satisfaits).
const blockingFailures = axisResults.filter(a => a.blocker && a.gate !== 'PASS');
const allCases = axisResults.flatMap(a => a.cases);
const counts = allCases.reduce((acc, c) => { acc[c.effectiveStatus] = (acc[c.effectiveStatus] || 0) + 1; return acc; }, {});
const verdict = blockingFailures.length === 0 ? 'GO' : 'NO-GO';

const statusIcon = { PASS: '🟢', PARTIAL: '🟡', GAP: '🔴', FALSE: '🟠', BROKEN: '🟠', SKIP: '⚪' };
const gateIcon = { PASS: '🟢', FAIL: '🔴', UNKNOWN: '⚪' };
const coverageLabel = a => a.kind === 'command' ? (a.gate === 'UNKNOWN' ? 'non exécuté' : a.gate) : `${a.passed}/${a.total}`;

// --- Rapport JSON ---
const json = {
  generatedAt: new Date().toISOString(),
  verdict,
  counts,
  axes: axisResults.map(a => ({ id: a.id, label: a.label, blocker: a.blocker, kind: a.kind, gate: a.gate, passed: a.passed, total: a.total })),
  blockingFailures: blockingFailures.map(a => a.id),
  cases: allCases.map(c => ({ id: c.id, axis: c.axis, chain: c.chain, status: c.effectiveStatus, pass: c.pass, title: c.title })),
};
fs.writeFileSync(path.join(reportsDir, 'business-validation.json'), JSON.stringify(json, null, 2));

// --- Rapport Markdown (le rapport "cas métier réellement vérifiés") ---
const lines = [];
lines.push('# MemoLib — Validation métier');
lines.push('');
lines.push(`> ${catalog.philosophy}`);
lines.push('');
lines.push(`**Verdict : ${verdict === 'GO' ? '🟢 GO' : '🔴 NO-GO'}**`);
lines.push('');
lines.push('## Axes de maturité');
lines.push('');
lines.push('| Axe | Bloquant | Résultat | Couverture |');
lines.push('|---|:---:|:---:|---:|');
for (const a of axisResults) {
  lines.push(`| ${a.label} | ${a.blocker ? '🔴' : '⚪'} | ${gateIcon[a.gate]} ${a.gate} | ${coverageLabel(a)} |`);
}
lines.push('');
lines.push('_Axes pilotés par commande (Production/Build, Tests techniques, E2E) : relancer avec `--run-commands` pour les exécuter ; sinon ⚪ « non exécuté » (jamais compté comme PASS)._');
lines.push('');
lines.push('## Business Logic — cas métier réellement vérifiés');
lines.push('');
lines.push('_Un cas ne compte que si un test importe le code de production réel et couvre le comportement. GAP = à écrire, FALSE = test trompeur à remplacer, BROKEN = PASS déclaré sans fichier de test réel._');
lines.push('');
for (const a of axisResults) {
  lines.push(`### ${a.label}  —  ${gateIcon[a.gate]} ${coverageLabel(a)}`);
  lines.push('');
  if (a.kind === 'command') {
    lines.push(`_Axe piloté par commande : ${a.commandDesc}_`);
    lines.push('');
    continue;
  }
  lines.push('| Cas | Chaîne | Statut | Détail |');
  lines.push('|---|---|:---:|---|');
  for (const c of a.cases) {
    const icon = statusIcon[c.effectiveStatus] || '⚪';
    const detail = c.effectiveStatus === c.status ? c.assertion : `(déclaré ${c.status}, reclassé ${c.effectiveStatus}) ${c.assertion}`;
    lines.push(`| **${c.id}** ${c.title} | ${c.chain} | ${icon} ${c.effectiveStatus} | ${detail.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');
}
lines.push('## Récapitulatif');
lines.push('');
lines.push(Object.entries(counts).map(([k, v]) => `- ${statusIcon[k] || '⚪'} **${k}** : ${v}`).join('\n'));
lines.push('');
if (blockingFailures.length) {
  lines.push('## Blockers (axes bloquants en échec)');
  lines.push('');
  for (const a of blockingFailures) {
    if (a.kind === 'command') {
      lines.push(`- ${a.gate === 'UNKNOWN' ? '⚪' : '🔴'} **${a.label}** — ${a.gate === 'UNKNOWN' ? 'non exécuté (relancer avec --run-commands)' : 'commande en échec'}`);
    } else {
      const missing = a.cases.filter(c => !c.pass).map(c => c.id).join(', ');
      lines.push(`- 🔴 **${a.label}** — cas non validés : ${missing}`);
    }
  }
  lines.push('');
}
lines.push('---');
lines.push('');
lines.push('_Règle de GO : besoin métier → règle métier → implémentation → test positif → test négatif → sécurité → traçabilité → résultat reproductible. Aucun axe bloquant ne doit être 🔴._');

const md = lines.join('\n');
fs.writeFileSync(path.join(reportsDir, 'business-validation.md'), md);
console.log(md);

if (strict && blockingFailures.length) {
  console.error(`\n[business-validation] NO-GO : ${blockingFailures.length} axe(s) bloquant(s) en échec.`);
  process.exit(1);
}
