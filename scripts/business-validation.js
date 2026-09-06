#!/usr/bin/env node
/**
 * Business-validation runner.
 *
 * Principe directeur: "le test existe" != "la logique métier est validée".
 * L'unité de validation est la CHAÎNE MÉTIER, pas le test unitaire.
 *
 * Garde-fous anti-faux-PASS:
 *  1. BROKEN     — un cas PASS déclaré dont expectedTest est absent du disque n'est jamais compté.
 *  2. awaitingFix — un test écrit qui échoue volontairement contre le code actuel reste GAP.
 *  3. GAP/FALSE/PARTIAL ne comptent jamais comme passant.
 *  4. Les axes "command" (build / tests / e2e) ne sont évalués qu'avec --run-commands.
 *     Sans exécution -> UNKNOWN (bloquant mais honnête), jamais un faux PASS/FAIL.
 *
 * Usage:
 *   node scripts/business-validation.js            # rapport (cas seulement, commandes = UNKNOWN)
 *   node scripts/business-validation.js --run-commands
 *   node scripts/business-validation.js --strict   # exit 1 si NO-GO
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const catalogue = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'business-cases.json'), 'utf8')
);
const reportsDir = path.join(root, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const args = process.argv.slice(2);
const runCommands = args.includes('--run-commands');
const strict = args.includes('--strict');

function fileExists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function commandOk(command) {
  try {
    execSync(command, { cwd: root, stdio: 'ignore', env: process.env });
    return true;
  } catch {
    return false;
  }
}

// ---- Evaluate each case ------------------------------------------------------
// Effective status: reclassify PASS -> BROKEN when its test file is missing,
// and force awaitingFix cases to remain GAP even if the file exists.
function effectiveStatus(c) {
  if (c.awaitingFix) return 'GAP';
  if (c.status === 'PASS' && !fileExists(c.expectedTest)) return 'BROKEN';
  return c.status;
}

const evaluatedCases = catalogue.cases.map((c) => {
  const effective = effectiveStatus(c);
  return {
    ...c,
    effectiveStatus: effective,
    testFileExists: fileExists(c.expectedTest),
    passing: effective === 'PASS',
  };
});

// ---- Evaluate command gates --------------------------------------------------
const commandGates = Object.entries(catalogue.commandGates || {}).map(
  ([id, gate]) => {
    let result = 'UNKNOWN';
    if (runCommands) {
      result = commandOk(gate.command) ? 'PASS' : 'FAIL';
    }
    return { id, ...gate, result, passing: result === 'PASS' };
  }
);

// ---- Aggregate per axis ------------------------------------------------------
const axes = {};
for (const [axisId, axisDef] of Object.entries(catalogue.axes)) {
  axes[axisId] = {
    id: axisId,
    ...axisDef,
    cases: [],
    commandGates: [],
    counts: { PASS: 0, PARTIAL: 0, FALSE: 0, GAP: 0, BROKEN: 0 },
    passing: false,
    verdict: 'UNKNOWN',
  };
}

for (const c of evaluatedCases) {
  const axis = axes[c.axis];
  if (!axis) continue;
  axis.cases.push(c);
  axis.counts[c.effectiveStatus] = (axis.counts[c.effectiveStatus] || 0) + 1;
}

for (const g of commandGates) {
  const axis = axes[g.axis];
  if (axis) axis.commandGates.push(g);
}

// Axis verdict:
//  - command axes: pass only if all their gates PASS (UNKNOWN/FAIL => not passing)
//  - case axes: pass only if there is >=1 case AND every case is PASS
for (const axis of Object.values(axes)) {
  if (axis.type === 'command') {
    if (axis.commandGates.length === 0) {
      axis.verdict = 'UNKNOWN';
      axis.passing = false;
    } else if (axis.commandGates.every((g) => g.result === 'PASS')) {
      axis.verdict = 'PASS';
      axis.passing = true;
    } else if (axis.commandGates.some((g) => g.result === 'FAIL')) {
      axis.verdict = 'FAIL';
      axis.passing = false;
    } else {
      axis.verdict = 'UNKNOWN';
      axis.passing = false;
    }
  } else {
    const total = axis.cases.length;
    const allPass = total > 0 && axis.cases.every((c) => c.passing);
    axis.passing = allPass;
    axis.verdict = allPass ? 'PASS' : 'FAIL';
  }
}

// ---- Global verdict ----------------------------------------------------------
const blockingAxes = Object.values(axes).filter((a) => a.blocking && !a.passing);
const allPassing = blockingAxes.length === 0;
const verdict = allPassing ? 'GO' : 'NO-GO';

const totals = evaluatedCases.reduce(
  (acc, c) => {
    acc[c.effectiveStatus] = (acc[c.effectiveStatus] || 0) + 1;
    return acc;
  },
  { PASS: 0, PARTIAL: 0, FALSE: 0, GAP: 0, BROKEN: 0 }
);

// ---- JSON output -------------------------------------------------------------
const jsonReport = {
  generatedAt: new Date().toISOString(),
  thesis: catalogue.thesis,
  commandsExecuted: runCommands,
  verdict,
  totals,
  axes: Object.values(axes).map((a) => ({
    id: a.id,
    label: a.label,
    type: a.type,
    blocking: a.blocking,
    verdict: a.verdict,
    passing: a.passing,
    counts: a.counts,
    commandGates: a.commandGates.map((g) => ({
      id: g.id,
      result: g.result,
      command: g.command,
    })),
  })),
  cases: evaluatedCases.map((c) => ({
    id: c.id,
    axis: c.axis,
    chain: c.chain,
    status: c.status,
    effectiveStatus: c.effectiveStatus,
    testFileExists: c.testFileExists,
    awaitingFix: Boolean(c.awaitingFix),
  })),
};
fs.writeFileSync(
  path.join(reportsDir, 'business-validation.json'),
  JSON.stringify(jsonReport, null, 2)
);

// ---- Markdown output ---------------------------------------------------------
const icon = {
  PASS: '🟢',
  FAIL: '🔴',
  UNKNOWN: '⚪',
  PARTIAL: '🟠',
  FALSE: '🔴',
  GAP: '🔴',
  BROKEN: '⛔',
};

function axisRow(a) {
  const detail =
    a.type === 'command'
      ? a.commandGates.map((g) => `${g.id}:${g.result}`).join(', ') || '—'
      : `${a.counts.PASS} PASS · ${a.counts.PARTIAL} PARTIAL · ${a.counts.FALSE} FALSE · ${a.counts.GAP} GAP${a.counts.BROKEN ? ` · ${a.counts.BROKEN} BROKEN` : ''}`;
  return `| ${icon[a.verdict] || '⚪'} ${a.label} | \`${a.type}\` | ${a.verdict} | ${detail} |`;
}

function caseTable(cases) {
  if (!cases.length) return '_Aucun cas._\n';
  const header =
    '| Cas | Chaîne | Statut | Test présent | Assertion |\n|---|---|---|:---:|---|';
  const rows = cases
    .map(
      (c) =>
        `| ${icon[c.effectiveStatus] || '⚪'} \`${c.id}\` | ${c.chain} | **${c.effectiveStatus}**${c.awaitingFix ? ' _(awaitingFix)_' : ''} | ${c.testFileExists ? '✅' : '❌'} | ${c.assertion} |`
    )
    .join('\n');
  return `${header}\n${rows}\n`;
}

let md = `# MemoLib — Validation métier (chaîne complète)\n\n`;
md += `> **Thèse produit :** ${catalogue.thesis}\n\n`;
md += `> Principe : *« le test existe » ≠ « la logique métier est validée »*. Un cas ne compte **PASS** que si un test **importe le code de production réel** et couvre le comportement.\n\n`;
md += `**Verdict : ${verdict === 'GO' ? '🟢 GO' : '🔴 NO-GO'}**`;
if (!runCommands) {
  md += ` _(axes command non exécutés — lancer avec \`--run-commands\`)_`;
}
md += `\n\n`;
md += `**Totaux cas :** 🟢 ${totals.PASS} PASS · 🟠 ${totals.PARTIAL} PARTIAL · 🔴 ${totals.FALSE} FALSE · 🔴 ${totals.GAP} GAP${totals.BROKEN ? ` · ⛔ ${totals.BROKEN} BROKEN` : ''}\n\n`;

md += `## Axes\n\n`;
md += `| Axe | Type | Verdict | Détail |\n|---|---|---|---|\n`;
md += Object.values(axes).map(axisRow).join('\n');
md += `\n\n`;

if (blockingAxes.length) {
  md += `## 🔴 Axes bloquants non satisfaits\n\n`;
  for (const a of blockingAxes) {
    md += `### ${a.label} (\`${a.id}\`)\n\n`;
    if (a.type === 'command') {
      md += `Axe basé commande. Résultats : ${a.commandGates.map((g) => `\`${g.id}\`=${g.result}`).join(', ') || '—'}.\n\n`;
    } else {
      const failing = a.cases.filter((c) => !c.passing);
      md += caseTable(failing);
      md += `\n`;
    }
  }
}

md += `## Détail par axe\n\n`;
for (const a of Object.values(axes)) {
  md += `### ${icon[a.verdict] || '⚪'} ${a.label} (\`${a.id}\`) — ${a.verdict}\n\n`;
  if (a.type === 'command') {
    for (const g of a.commandGates) {
      md += `- \`${g.id}\` — ${g.description} — commande : \`${g.command}\` — **${g.result}**\n`;
    }
    md += `\n`;
  } else {
    md += caseTable(a.cases);
    md += `\n`;
  }
}

md += `## Règle GO/NO-GO\n\n`;
md += `GO uniquement si **tous** les axes bloquants passent. Un axe \`cases\` passe si tous ses cas sont \`PASS\`. Un axe \`command\` passe si toutes ses commandes retournent \`PASS\` (\`UNKNOWN\`/\`FAIL\` bloquent).\n`;

fs.writeFileSync(path.join(reportsDir, 'business-validation.md'), md);
console.log(md);

if (strict && verdict === 'NO-GO') {
  process.exit(1);
}
