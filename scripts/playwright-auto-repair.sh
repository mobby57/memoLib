#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TEST_FILE="${TEST_FILE:-tests/e2e/saas-pilot.spec.ts}"
PROJECT="${PROJECT:-chromium}"
WORKERS="${WORKERS:-1}"
MAX_ROUNDS="${MAX_ROUNDS:-5}"
GREP="${GREP:-}"
PW_TIMEOUT="${PW_TIMEOUT:-180}"

LOG_DIR="${LOG_DIR:-.playwright-auto-repair}"
BACKUP="${TEST_FILE}.auto-repair.bak"

mkdir -p "$LOG_DIR"

echo "============================================================"
echo " Playwright Auto-Repair Global"
echo "============================================================"
echo "Test     : $TEST_FILE"
echo "Project  : $PROJECT"
echo "Workers  : $WORKERS"
echo "Rounds   : $MAX_ROUNDS"
echo "Grep     : ${GREP:-<tous les tests>}"
echo

[[ -f "$TEST_FILE" ]] || {
  echo "❌ Test introuvable: $TEST_FILE"
  exit 1
}

if [[ ! -f "$BACKUP" ]]; then
  cp "$TEST_FILE" "$BACKUP"
  echo "✓ Backup: $BACKUP"
fi

run_tests() {
  local log="$1"

  local cmd=(
    npx playwright test
    "$TEST_FILE"
    "--project=$PROJECT"
    "--workers=$WORKERS"
  )

  [[ -n "$GREP" ]] && cmd+=("--grep=$GREP")

  echo
  echo "▶ ${cmd[*]}"
  echo

  set +e
  timeout "${PW_TIMEOUT}s" "${cmd[@]}" 2>&1 | tee "$log"
  local status="${PIPESTATUS[0]}"
  set -e

  return "$status"
}

repair_locators() {
  python3 - "$TEST_FILE" <<'PY'
from pathlib import Path
import sys

p = Path(sys.argv[1])
s = p.read_text()
old = s

# 1. "Gratuit" doit être exact pour éviter le strict mode.
s = s.replace(
    "page.locator('text=Gratuit')",
    "page.getByText('Gratuit', { exact: true })"
)

# 2. Ancien libellé du bouton.
s = s.replace(
    "await page.click('text=Essai pilote gratuit');",
    "await page.getByRole('link', { name: /Essai gratuit/i }).first().click();"
)

# Variante sans await dans le texte original.
s = s.replace(
    "page.click('text=Essai pilote gratuit')",
    "page.getByRole('link', { name: /Essai gratuit/i }).first().click()"
)

# 3. Validation inscription.
s = s.replace(
    "page.locator('text=obligatoires')",
    "page.getByText('champs obligatoires', { exact: false })"
)

# 4. Locator login plus robuste.
s = s.replace(
    "page.locator('text=Identifiants')",
    "page.getByText('Identifiants', { exact: false })"
)

if s != old:
    p.write_text(s)
    print("CHANGED")
else:
    print("UNCHANGED")
PY
}

show_server_diagnostics() {
  echo
  echo "--- Diagnostics Next.js ---"

  if [[ -f ".next/dev/logs/next-development.log" ]]; then
    tail -60 .next/dev/logs/next-development.log || true
  else
    echo "Pas de log Next.js trouvé."
  fi

  echo
  echo "--- Processus Next ---"
  pgrep -af "next dev" || true

  echo
  echo "--- Ports 3000/3001 ---"
  ss -ltnp 2>/dev/null | grep -E ':3000|:3001' || true
}

for ((round=1; round<=MAX_ROUNDS; round++)); do

  echo
  echo "============================================================"
  echo " ROUND $round / $MAX_ROUNDS"
  echo "============================================================"

  LOG="$LOG_DIR/round-${round}.log"

  if run_tests "$LOG"; then
    echo
    echo "============================================================"
    echo " ✅ 0 FAILED — TESTS VERTS"
    echo "============================================================"
    echo
    exit 0
  fi

  echo
  echo "⚠️ Tests en échec."

  # ----------------------------------------------------------
  # Locator connu
  # ----------------------------------------------------------

  if grep -Eq     "strict mode violation|element\(s\) not found|waiting for locator|waiting for getBy"     "$LOG"; then

    echo
    echo "🔎 Erreur de locator détectée."

    BEFORE="$(sha256sum "$TEST_FILE" | cut -d' ' -f1)"

    repair_locators

    AFTER="$(sha256sum "$TEST_FILE" | cut -d' ' -f1)"

    if [[ "$BEFORE" != "$AFTER" ]]; then
      echo "✓ Correction connue appliquée."

      # Vérification TypeScript si disponible.
      if [[ -f tsconfig.json ]]; then
        echo "▶ Vérification TypeScript..."

        if ! npx tsc --noEmit --pretty false; then
          echo "❌ TypeScript invalide après réparation."
          echo "↩ Restauration du test."
          cp "$BACKUP" "$TEST_FILE"
          exit 1
        fi

        echo "✓ TypeScript OK"
      fi

      echo "↻ Relance..."
      sleep 1
      continue
    fi

    echo
    echo "❌ Locator en échec mais aucune correction connue."
    echo "Refus de modifier arbitrairement le test."
    echo
    tail -100 "$LOG"
    exit 1
  fi

  # ----------------------------------------------------------
  # Timeout / serveur Next
  # ----------------------------------------------------------

  if grep -Eq     "TimeoutError|page.goto: Timeout|apiRequestContext.*Timeout|Test timeout"     "$LOG"; then

    echo
    echo "⏱️ Timeout détecté."
    echo "Aucune modification de l'assertion métier."
    show_server_diagnostics

    if (( round < MAX_ROUNDS )); then
      echo
      echo "↻ Retry automatique..."
      sleep 3
      continue
    fi

    echo
    echo "❌ Timeout persistant après $MAX_ROUNDS rounds."
    exit 1
  fi

  # ----------------------------------------------------------
  # Serveur Next déjà actif
  # ----------------------------------------------------------

  if grep -Eq     "Another next dev server is already running|Port [0-9]+ is in use"     "$LOG"; then

    echo
    echo "⚠️ Plusieurs processus Next.js détectés."
    show_server_diagnostics

    if (( round < MAX_ROUNDS )); then
      echo
      echo "↻ Retry automatique..."
      sleep 3
      continue
    fi

    exit 1
  fi

  # ----------------------------------------------------------
  # Erreur inconnue
  # ----------------------------------------------------------

  echo
  echo "============================================================"
  echo " ❌ ERREUR NON RECONNUE"
  echo "============================================================"
  echo
  tail -120 "$LOG"
  echo

  exit 1

done

echo "❌ MAX_ROUNDS atteint."
exit 1
