#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 1. Correction state-machine.ts"

python3 - <<'PY'
from pathlib import Path

p = Path("src/lib/processing/state-machine.ts")
s = p.read_text()

old = """      tenantId,
      isProcessed: { in: ['RECEIVED', 'NORMALIZED', 'CLASSIFIED', 'LINKED'] },
      isProcessed: false,
      updatedAt: { lt: cutoff },
"""

new = """      tenantId,
      isProcessed: { in: ['RECEIVED', 'NORMALIZED', 'CLASSIFIED', 'LINKED'] },
      updatedAt: { lt: cutoff },
"""

if old in s:
    s = s.replace(old, new)
    p.write_text(s)
    print("OK state-machine.ts")
else:
    print("INFO state-machine.ts: doublon déjà absent ou structure différente")

PY

echo "==> 2. Correction integrate/route.ts"

python3 - <<'PY'
from pathlib import Path

p = Path("src/app/api/emails/[id]/integrate/route.ts")
s = p.read_text()

old = """  const updateData: any = {
    isProcessed: 'INTEGRATED',
    isProcessed: true,
    processedAt: new Date(),
  };
"""

new = """  const updateData: any = {
    isProcessed: true,
    processedAt: new Date(),
  };
"""

if old in s:
    s = s.replace(old, new)
    p.write_text(s)
    print("OK integrate/route.ts")
else:
    print("INFO integrate/route.ts: doublon déjà absent ou structure différente")

PY

echo "==> 3. Migration Sentry client -> instrumentation-client.ts"

python3 - <<'PY'
from pathlib import Path

src = Path("sentry.client.config.ts")

if not src.exists():
    print("INFO sentry.client.config.ts absent")
    raise SystemExit(0)

content = src.read_text()

# Retire l'ancien import dynamique éventuel du fichier instrumentation-client.
inst = Path("instrumentation-client.ts")
inst_content = inst.read_text() if inst.exists() else ""

import_block = """// This file configures the initialization of Sentry on the client.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if a valid DSN is configured
if (dsn && !dsn.includes('your-key')) {
"""

# Le fichier actuel contient déjà exactement la configuration Sentry.
# On reconstruit instrumentation-client.ts en gardant le hook Next.js.
config_start = content.find("import * as Sentry from '@sentry/nextjs';")

if config_start == -1:
    raise RuntimeError("Impossible de trouver l'import Sentry dans sentry.client.config.ts")

sentry_code = content[config_start:]

# instrumentation-client doit initialiser Sentry directement.
new_inst = """// Client-side Sentry initialization.
// Next.js loads this file automatically.

""" + sentry_code + """

export const onRouterTransitionStart = () => {
  // Sentry handles client navigation instrumentation.
};
"""

inst.write_text(new_inst)

# Supprime l'ancien fichier devenu inutile.
src.unlink()

print("OK instrumentation-client.ts migré")
print("OK sentry.client.config.ts supprimé")

PY

echo "==> 4. Nettoyage tsconfig.json"

python3 - <<'PY'
from pathlib import Path
import json

p = Path("tsconfig.json")
data = json.loads(p.read_text())

files = data.get("exclude", [])
if "sentry.client.config.ts" in files:
    data["exclude"] = [x for x in files if x != "sentry.client.config.ts"]
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print("OK tsconfig.json")
else:
    print("INFO tsconfig.json: entrée déjà absente")

PY

echo "==> 5. Vérification des anciens imports Sentry client"

if grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude='*.map' \
  "sentry.client.config" \
  . 2>/dev/null; then

  echo
  echo "ATTENTION: référence restante à sentry.client.config.ts"
else
  echo "OK aucune référence à sentry.client.config.ts"
fi

echo
echo "==> 6. Vérification TypeScript"

npx tsc --noEmit --skipLibCheck

echo
echo "=========================================="
echo " CORRECTIONS TERMINEES"
echo "=========================================="
echo
echo "Sentry client      : instrumentation-client.ts"
echo "Ancien config      : supprimé"
echo "TS duplicate #1    : corrigé"
echo "TS duplicate #2    : corrigé"
echo
echo "Prochaine étape :"
echo "  npm test"
echo
