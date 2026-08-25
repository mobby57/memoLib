#!/usr/bin/env bash
set +e

REPORT="prelaunch-audit-report.txt"
PASS=0
WARN=0
FAIL=0

pass(){ PASS=$((PASS+1)); echo "OK   $1"; }
warn(){ WARN=$((WARN+1)); echo "WARN $1"; }
fail(){ FAIL=$((FAIL+1)); echo "FAIL $1"; }

echo "=========================================="
echo " MEMOLIB PRE-LAUNCH AUDIT"
echo "=========================================="

echo
echo "=== ENVIRONNEMENT ==="

command -v node >/dev/null && pass "Node $(node --version)" || fail "Node absent"
command -v npm >/dev/null && pass "npm $(npm --version)" || fail "npm absent"
command -v git >/dev/null && pass "Git disponible" || fail "Git absent"
command -v docker >/dev/null && pass "Docker disponible" || warn "Docker absent"

echo
echo "=== GIT ==="

git rev-parse --is-inside-work-tree >/dev/null 2>&1   && pass "Dépôt Git détecté"   || fail "Dépôt Git absent"

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  warn "Modifications locales présentes"
else
  pass "Working tree propre"
fi

echo
echo "=== DEPENDANCES ==="

[ -f package.json ] && pass "package.json" || fail "package.json absent"
[ -f package-lock.json ] && pass "package-lock.json" || warn "package-lock.json absent"
[ -d node_modules ] && pass "node_modules" || warn "node_modules absent"

echo
echo "=== TYPESCRIPT ==="

if [ -f tsconfig.json ]; then
  npx tsc --noEmit --pretty false >/tmp/memolib-tsc.log 2>&1
  if [ $? -eq 0 ]; then
    pass "TypeScript OK"
  else
    fail "TypeScript en erreur"
    tail -30 /tmp/memolib-tsc.log
  fi
else
  warn "tsconfig.json absent"
fi

echo
echo "=== JEST ==="

if npm run 2>/dev/null | grep -q "test"; then
  npm test -- --runInBand >/tmp/memolib-jest.log 2>&1
  if [ $? -eq 0 ]; then
    pass "Tests Jest OK"
  else
    fail "Tests Jest en erreur"
    tail -40 /tmp/memolib-jest.log
  fi
else
  warn "Script test absent"
fi

echo
echo "=== BUILD ==="

npm run build >/tmp/memolib-build.log 2>&1
if [ $? -eq 0 ]; then
  pass "Build production OK"
else
  fail "Build production en erreur"
  tail -40 /tmp/memolib-build.log
fi

echo
echo "=== PRISMA ==="

if [ -f prisma/schema.prisma ]; then
  npx prisma validate >/tmp/memolib-prisma.log 2>&1
  if [ $? -eq 0 ]; then
    pass "Prisma OK"
  else
    fail "Prisma en erreur"
    tail -30 /tmp/memolib-prisma.log
  fi
else
  warn "Prisma absent"
fi

echo
echo "=== CONFIG VS CODE ==="

if [ -f .vscode/tasks.json ]; then
  grep -qE "docker-build|docker-run" .vscode/tasks.json     && fail "Anciennes tâches docker VS Code présentes"     || pass "tasks.json sans docker-build/docker-run"
fi

if [ -f .vscode/launch.json ]; then
  grep -q "preLaunchTask.*docker-run" .vscode/launch.json     && fail "launch.json référence docker-run"     || pass "launch.json sans docker-run"
fi

echo
echo "=== RESULTAT ==="
echo "PASS : $PASS"
echo "WARN : $WARN"
echo "FAIL : $FAIL"

{
  echo "PASS : $PASS"
  echo "WARN : $WARN"
  echo "FAIL : $FAIL"
} > "$REPORT"

if [ "$FAIL" -eq 0 ]; then
  echo "RESULTAT : AUCUN BLOCAGE CRITIQUE"
else
  echo "RESULTAT : $FAIL BLOCAGE(S) A CORRIGER"
fi

echo "Rapport : $REPORT"
exit "$FAIL"
