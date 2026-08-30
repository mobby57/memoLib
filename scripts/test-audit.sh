#!/usr/bin/env bash

set -uo pipefail

echo "=============================================="
echo " memoLib — TEST QUALITY AUDIT"
echo "=============================================="
echo

echo "▶ Node:"
node --version
echo

echo "▶ Vitest:"
npx vitest --version
echo

echo "▶ Running test suite..."
echo

# Vitest 4.x : ne pas utiliser les options Jest
npm test -- --coverage

TEST_EXIT=$?

echo
echo "=============================================="
echo " COVERAGE AUDIT"
echo "=============================================="

COVERAGE_FILE="coverage/coverage-final.json"

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "❌ $COVERAGE_FILE not found."
  echo
  echo "Available coverage files:"
  find coverage -maxdepth 2 -type f 2>/dev/null | sort || true
  exit 1
fi

echo "✓ Coverage data found: $COVERAGE_FILE"
echo

node <<'NODE'
const fs = require('fs');

const file = 'coverage/coverage-final.json';

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const files = Object.values(data);

function pct(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100;
}

function totals(type) {
  let covered = 0;
  let total = 0;

  for (const file of files) {
    const metric = file[type];

    if (!metric) continue;

    for (const value of Object.values(metric)) {
      total++;
      if (value > 0) covered++;
    }
  }

  return { covered, total };
}

function lineTotals() {
  let covered = 0;
  let total = 0;

  for (const file of files) {
    const metric = file.l;

    if (!metric) continue;

    for (const value of Object.values(metric)) {
      total++;
      if (value > 0) covered++;
    }
  }

  return { covered, total };
}

const statements = totals('s');
const functions = totals('f');
const branches = totals('b');
const lines = lineTotals();

const result = {
  statements: pct(statements.covered, statements.total),
  branches: pct(branches.covered, branches.total),
  functions: pct(functions.covered, functions.total),
  lines: pct(lines.covered, lines.total),
};

console.log(`Statements : ${result.statements.toFixed(2)}%`);
console.log(`Branches   : ${result.branches.toFixed(2)}%`);
console.log(`Functions  : ${result.functions.toFixed(2)}%`);
console.log(`Lines      : ${result.lines.toFixed(2)}%`);
console.log();

const thresholds = {
  statements: 75,
  branches: 65,
  functions: 80,
  lines: 75,
};

let failed = false;

for (const [metric, threshold] of Object.entries(thresholds)) {
  if (result[metric] < threshold) {
    console.log(
      `❌ ${metric}: ${result[metric].toFixed(2)}% < ${threshold}%`
    );
    failed = true;
  } else {
    console.log(
      `✓ ${metric}: ${result[metric].toFixed(2)}% >= ${threshold}%`
    );
  }
}

console.log();

if (failed) {
  console.log('❌ COVERAGE AUDIT FAILED');
  process.exitCode = 1;
} else {
  console.log('✓ COVERAGE AUDIT PASSED');
}
NODE

AUDIT_EXIT=$?

echo
echo "=============================================="
echo " FINAL RESULT"
echo "=============================================="

if [ "$TEST_EXIT" -ne 0 ]; then
  echo "❌ Test suite failed."
  exit "$TEST_EXIT"
fi

if [ "$AUDIT_EXIT" -ne 0 ]; then
  echo "❌ Coverage audit failed."
  exit "$AUDIT_EXIT"
fi

echo "✓ Tests passed."
echo "✓ Coverage audit passed."
exit 0
